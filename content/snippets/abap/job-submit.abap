DATA: lv_jobname  TYPE tbtco-jobname VALUE 'Z_MRP_NIGHTLY',
      lv_jobcount TYPE tbtco-jobcount,
      lv_repid    TYPE sy-repid VALUE 'Z_MRP_RUN'.

CALL FUNCTION 'JOB_OPEN'
  EXPORTING
    jobname  = lv_jobname
  IMPORTING
    jobcount = lv_jobcount
  EXCEPTIONS
    cant_create_job = 1
    invalid_job_data = 2
    jobname_missing = 3
    OTHERS = 4.
IF sy-subrc <> 0.
  MESSAGE 'Cannot open job' TYPE 'E'.
  RETURN.
ENDIF.

SUBMIT (lv_repid)
  VIA JOB lv_jobname NUMBER lv_jobcount
  AND RETURN.

CALL FUNCTION 'JOB_CLOSE'
  EXPORTING
    jobname  = lv_jobname
    jobcount = lv_jobcount
    strtimmed = abap_true
  EXCEPTIONS
    cant_start_immediate = 1
    invalid_startdate = 2
    jobname_missing = 3
    job_close_failed = 4
    job_nosteps = 5
    job_notex = 6
    lock_failed = 7
    OTHERS = 8.
IF sy-subrc <> 0.
  MESSAGE 'Cannot close or schedule job' TYPE 'E'.
ENDIF.
