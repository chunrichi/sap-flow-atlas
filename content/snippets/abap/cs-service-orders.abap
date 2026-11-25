PARAMETERS: p_from TYPE aufk-erdat.

SELECT a~aufnr, a~auart, a~erdat, h~equnr
  FROM aufk AS a
  LEFT OUTER JOIN afih AS h ON h~aufnr = a~aufnr
  INTO TABLE @DATA(lt_orders)
  WHERE a~auart = 'SM03'
    AND a~erdat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No service orders found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_orders INTO DATA(ls_order).
  WRITE: / ls_order-aufnr, ls_order-equnr,
           ls_order-erdat.
ENDLOOP.
