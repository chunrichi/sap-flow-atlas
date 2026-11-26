DATA(lv_top) = 5.
DATA(lv_url) = |/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$top={ lv_top }|.

DATA(lo_client) = cl_http_client=>create_by_destination( 'S4HANA' ).
lo_client->request->set_method( if_http_request=>co_request_method_get ).
lo_client->request->set_uri( lv_url ).
lo_client->request->set_header_field( name = 'Accept' value = 'application/json' ).
lo_client->propertytype_logon_popup = if_http_client=>co_disabled.

lo_client->send( ).
lo_client->receive( ).

DATA(lv_status) = lo_client->response->get_status( ).
DATA(lv_body)   = lo_client->response->get_cdata( ).

IF lv_status-code <> 200.
  MESSAGE |OData call failed: { lv_status-code } { lv_status-reason }| TYPE 'E'.
  RETURN.
ENDIF.

" 生产代码用 /ui2/cl_json 反序列化，避免手工解析
cl_http_client=>close( EXPORTING client = lo_client ).

" lv_body 可继续交给 /ui2/cl_json=>deserialize
