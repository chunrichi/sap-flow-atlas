PARAMETERS: p_kostl TYPE csks-kostl,
            p_gjahr TYPE cosp-gjahr.

SELECT SINGLE kostl, datbi
  FROM csks
  INTO @DATA(ls_cc)
  WHERE kostl = @p_kostl
    AND datbi >= @sy-datum.

IF sy-subrc <> 0.
  MESSAGE 'Cost center not found' TYPE 'I'.
  RETURN.
ENDIF.

SELECT SUM( wkg001 ) AS p01,
       SUM( wkg002 ) AS p02
  FROM cosp
  INTO @DATA(ls_actual)
  WHERE kostl = @p_kostl
    AND gjahr = @p_gjahr.

WRITE: / ls_cc-kostl, 'P01:', ls_actual-p01,
         'P02:', ls_actual-p02.
