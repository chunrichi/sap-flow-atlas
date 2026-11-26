DATA: lv_docnum TYPE edidc-docnum.
PARAMETERS p_docnum TYPE edidc-docnum.

SELECT SINGLE docnum, messty, status, credat
  FROM edidc
  INTO @DATA(ls_control)
  WHERE docnum = @p_docnum.

IF sy-subrc <> 0.
  MESSAGE 'IDoc not found' TYPE 'E'.
  RETURN.
ENDIF.

IF ls_control-status <> '64'.
  MESSAGE 'IDoc is not ready for inbound processing' TYPE 'E'.
  RETURN.
ENDIF.

" 读取 ORDERS05 的控制段与数据段
SELECT segnum, segnam, sdata
  FROM edid4
  INTO TABLE @DATA(lt_segments)
  WHERE docnum = @p_docnum
  ORDER BY segnum.

" 交给入站处理框架；实际项目通常用入站函数或 BAPI 组装
CALL FUNCTION 'IDOC_INBOUND_ASYNCHRONOUS'
  EXPORTING
    idoc_control = ls_control
  EXCEPTIONS
    idoc_not_saved = 1
    OTHERS         = 2.

IF sy-subrc <> 0.
  MESSAGE 'Inbound processing failed' TYPE 'E'.
ENDIF.
