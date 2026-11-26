DATA: lt_container TYPE TABLE OF swr_cont,
      ls_container TYPE swr_cont,
      lv_workitem  TYPE swr_struct-workitemid.

ls_container-element = 'ORDER_ID'.
ls_container-value   = '0000004711'.
APPEND ls_container TO lt_container.

ls_container-element = 'AMOUNT'.
ls_container-value   = '1250.00'.
APPEND ls_container TO lt_container.

CALL FUNCTION 'SAP_WAPI_START_WORKFLOW'
  EXPORTING
    task         = 'TS90000001'
    container    = lt_container
  IMPORTING
    workitem_id  = lv_workitem
  EXCEPTIONS
    workflow_not_found = 1
    OTHERS = 2.

IF sy-subrc <> 0.
  MESSAGE 'Cannot start workflow' TYPE 'E'.
  RETURN.
ENDIF.

" 后续可在 SBWP 收件箱查看工作项
WRITE: / 'Work item:', lv_workitem.
