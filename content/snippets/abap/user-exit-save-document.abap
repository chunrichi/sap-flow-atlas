FORM user_exit_save_document.
  DATA: ls_audit TYPE zsd_order_audit.

  " 只处理销售订单，避免影响报价与合同
  IF vbak-vbtyp <> 'C'.
    RETURN.
  ENDIF.

  " 只在当天新建的订单上写审计记录
  IF vbak-erdat <> sy-datum OR vbak-ernam <> sy-uname.
    RETURN.
  ENDIF.

  ls_audit-vbeln = vbak-vbeln.
  ls_audit-ernam = sy-uname.
  ls_audit-erdat = sy-datum.
  ls_audit-erzet = sy-uzeit.
  ls_audit-tcode = sy-tcode.

  INSERT zsd_order_audit FROM ls_audit.
  IF sy-subrc <> 0.
    MESSAGE 'Audit log write failed' TYPE 'E'.
  ENDIF.
ENDFORM.
