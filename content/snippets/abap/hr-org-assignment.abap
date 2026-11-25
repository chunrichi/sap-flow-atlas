PARAMETERS: p_from TYPE pa0001-begda.

SELECT pernr, werks, btrtl, kostl, orgeh, begda, endda
  FROM pa0001
  INTO TABLE @DATA(lt_employees)
  WHERE begda <= @sy-datum
    AND endda >= @sy-datum
    AND begda >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No active employees found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_employees INTO DATA(ls_employee).
  WRITE: / ls_employee-pernr, ls_employee-werks,
           ls_employee-btrtl, ls_employee-kostl,
           ls_employee-orgeh.
ENDLOOP.
