DATA: lt_orders TYPE STANDARD TABLE OF vbak,
      lt_items  TYPE STANDARD TABLE OF vbap.

SELECT vbeln, erdat, netwr, waerk
  FROM vbak
  INTO TABLE @lt_orders
  WHERE erdat = @sy-datum.

IF sy-subrc <> 0.
  MESSAGE 'No sales orders today' TYPE 'I'.
  RETURN.
ENDIF.

SELECT vbeln, posnr, matnr, kwmeng
  FROM vbap
  INTO TABLE @lt_items
  FOR ALL ENTRIES IN @lt_orders
  WHERE vbeln = @lt_orders-vbeln.

WRITE: / 'Orders:', lines( lt_orders ).
WRITE: / 'Items:', lines( lt_items ).
