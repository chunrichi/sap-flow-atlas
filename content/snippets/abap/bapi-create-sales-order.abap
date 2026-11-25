FORM create_sales_order.
  DATA: ls_header     TYPE bapisdhd1,
        ls_headerx    TYPE bapisdhd1x,
        ls_item       TYPE bapisditm,
        ls_itemx      TYPE bapisditmx,
        ls_partner    TYPE bapiparnr,
        lt_items      TYPE STANDARD TABLE OF bapisditm,
        lt_itemsx     TYPE STANDARD TABLE OF bapisditmx,
        lt_partners   TYPE STANDARD TABLE OF bapiparnr,
        lt_return     TYPE STANDARD TABLE OF bapiret2,
        lv_salesorder TYPE bapivbeln-vbeln.

  " 订单头：订单类型、销售组织、分销渠道与产品组
  ls_header-doc_type    = 'OR'.
  ls_header-sales_org   = '1000'.
  ls_header-distr_chan  = '10'.
  ls_header-division    = '00'.
  ls_header-purch_no_c  = 'DEMO-PO-001'.
  ls_headerx-updateflag = 'I'.

  " 行项目：物料、数量与工厂
  ls_item-itm_number = '000010'.
  ls_item-material   = 'MAT-1000'.
  ls_item-target_qty = '10'.
  ls_item-plant      = '1000'.
  APPEND ls_item TO lt_items.

  ls_itemx-itm_number = '000010'.
  ls_itemx-updateflag = 'I'.
  APPEND ls_itemx TO lt_itemsx.

  " 售达方
  ls_partner-partn_role = 'AG'.
  ls_partner-partn_numb = '0000001000'.
  APPEND ls_partner TO lt_partners.

  CALL FUNCTION 'BAPI_SALESORDER_CREATEFROMDAT2'
    EXPORTING
      order_header_in  = ls_header
      order_header_inx = ls_headerx
    IMPORTING
      salesdocument    = lv_salesorder
    TABLES
      return           = lt_return
      order_items_in   = lt_items
      order_items_inx  = lt_itemsx
      order_partners   = lt_partners.

  " BAPI 返回错误时必须回滚，避免留下不完整订单
  READ TABLE lt_return TRANSPORTING NO FIELDS WITH KEY type = 'E'.
  IF sy-subrc = 0.
    CALL FUNCTION 'BAPI_TRANSACTION_ROLLBACK'.
    RETURN.
  ENDIF.

  CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
    EXPORTING
      wait = abap_true.

  WRITE: / 'Sales order created:', lv_salesorder.
ENDFORM.
