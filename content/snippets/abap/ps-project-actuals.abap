PARAMETERS: p_pspid TYPE proj-pspid.

SELECT p~pspnr, p~pspid, w~posid,
       c~wkg001, c~wkg002
  FROM proj AS p
  INNER JOIN prps AS w ON w~pspnr = p~pspnr
  INNER JOIN cosp AS c ON c~objnr = w~objnr
  INTO TABLE @DATA(lt_actual)
  WHERE p~pspid = @p_pspid.

IF sy-subrc <> 0.
  MESSAGE 'No project actuals found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_actual INTO DATA(ls_actual).
  WRITE: / ls_actual-posid, ls_actual-wkg001,
           ls_actual-wkg002.
ENDLOOP.
