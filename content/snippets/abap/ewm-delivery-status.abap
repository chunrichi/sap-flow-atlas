PARAMETERS: p_from TYPE likp-erdat.

SELECT l~vbeln, l~lfart, l~wbstk, l~erdat,
       i~matnr, i~lfimg
  FROM likp AS l
  INNER JOIN lips AS i ON i~vbeln = l~vbeln
  INTO TABLE @DATA(lt_deliveries)
  WHERE l~wbstk <> 'C'
    AND l~erdat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No open deliveries found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_deliveries INTO DATA(ls_delivery).
  WRITE: / ls_delivery-vbeln, ls_delivery-matnr,
           ls_delivery-lfimg, ls_delivery-wbstk.
ENDLOOP.
