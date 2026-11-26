" 检查事务码权限
AUTHORITY-CHECK OBJECT 'S_TCODE'
  ID 'TCD' FIELD 'VA01'.
IF sy-subrc <> 0.
  MESSAGE 'No transaction authorization for VA01' TYPE 'E'.
  RETURN.
ENDIF.

" 检查销售组织/渠道/产品组范围
AUTHORITY-CHECK OBJECT 'V_VBAK_VKO'
  ID 'VKORG' FIELD '1000'
  ID 'VTWEG' FIELD '10'
  ID 'SPART' FIELD '00'.
IF sy-subrc <> 0.
  MESSAGE 'No sales area authorization' TYPE 'E'.
  RETURN.
ENDIF.

" 失败时把对象与字段写入 SU53 分析
MESSAGE 'Authorization check passed' TYPE 'S'.
