import os

# Windows subprocess argument
DETACHED_PROCESS = 8

# App name
SELF_DIR_NAME = "python_upgrade_readiness_app"

# Splunk Path
SPLUNK_HOME = os.environ["SPLUNK_HOME"]
SPLUNK_PATH = os.path.join(SPLUNK_HOME, 'bin', 'splunk')

# Directory paths
OTHER_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'apps')
SLAVE_APPS_DIR = os.path.join(SPLUNK_HOME, 'etc', 'slave-apps')
APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
LOCAL_DIR = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local')
REPORT_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'reports')
MAKO_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'mako')
SESSION_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'sessions')
CSV_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'libs_py2', 'pura_libs_utils')
SYNCED_CSV_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'app_list')
PROCESS_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'bin', 'scan_process.py')
MD5_HASH_PATH = os.path.join(APP_DIR, 'python_upgrade_readiness_app', 'local', 'md5_hash.json')

# Constant
ALL_APPS_NAME = "pura_all_results"
OUTPUT_MODE_JSON = "output_mode=json"
HTML_EXTENSION = ".html"
PERSISTENT_FILE_JSON = "{}_0000000000.json"
EMAIL_ATTACHMENT_NAME = "python_upgrade_scan_{}_{}.json"
SUBJECT = "Python Upgrade Readiness Scan Notification"
BODY = "Hello Splunk Admin,\nThere {} {} {} that {} Python issues on {} stack that needs your attention. "\
        "Please check the Python Upgrade Readiness App for more details on addressing outstanding items."

# REST endpoints
instance_apps_endpoint = "/services/apps/local"
user_role_endpoint = "/services/authentication/users"
telemetry_endpoint = "/servicesNS/nobody/search/telemetry-metric"
kvstore_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_get_progress"
kvstore_endpoint_json = "{}?{}".format(kvstore_endpoint, OUTPUT_MODE_JSON)
dismiss_coll_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_dismiss_file"
dismiss_app_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_dismiss_app"
alert_actions_endpoint = "admin/alert_actions"
schedule_scan_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/storage/collections/data/pra_schedule_scan"
schedule_scan_endpoint_json = "{}?{}".format(schedule_scan_endpoint, OUTPUT_MODE_JSON)
schedule_scan_interval_endpoint = "/servicesNS/nobody/python_upgrade_readiness_app/data/inputs/script/{}"
get_host_endpoint = "/services/server/info"

# REST success codes
success_codes = ['200', '201', '204']

# System default apps
SYSTEM_APPS = ['search', 'splunk_archiver', 'splunk_instrumentation', 'splunk_monitoring_console', 'learned',
               'splunk_gdi', 'splunk_metrics_workspace', 'splunk_httpinput', 'SplunkLightForwarder',
               'SplunkForwarder', 'sample_app', 'legacy', 'launcher', 'user-prefs', 'introspection_generator_addon',
               'gettingstarted', 'appsbrowser', 'default', 'alert_webhook', 'alert_logevent', 'python_upgrade_readiness_app',
               'framework', 'splunk_rapid_diag', 'splunk_secure_gateway', 'splunk_internal_metrics', 'journald_input', 'upgrade_readiness_app', '_cluster']

# Whitelisted apps
PREMIUM_APPS = ['DA-ITSI-APPSERVER', 'DA-ITSI-DATABASE', 'DA-ITSI-EUEM', 'DA-ITSI-LB', 'DA-ITSI-OS', 'DA-ITSI-STORAGE',
                'DA-ITSI-VIRTUALIZATION', 'DA-ITSI-WEBSERVER', 'SA-IndexCreation', 'SA-ITOA', 'SA-ITSI-ATAD',
                'SA-ITSI-CustomModuleViz', 'SA-ITSI-Licensechecker', 'SA-ITSI-MetricAD', 'SA-UserAccess', 'itsi',
                'Splunk_TA_mint', 'splunk_app_mint', 'Splunk_SA_Scientific_Python_linux_x86',
                'Splunk_SA_Scientific_Python_windows_x86_64', 'Splunk_SA_Scientific_Python_darwin_x86_64',
                'Splunk_SA_Scientific_Python_linux_x86_64', 'SplunkEnterpriseSecuritySuite', 'DA-ESS-AccessProtection',
                'DA-ESS-EndpointProtection', 'DA-ESS-IdentityManagement', 'DA-ESS-NetworkProtection',
                'DA-ESS-ThreatIntelligence', 'SA-AccessProtection', 'SA-AuditAndDataProtection',
                'SA-EndpointProtection', 'SA-IdentityManagement', 'SA-NetworkProtection', 'SA-ThreatIntelligence',
                'SA-UEBA', 'SA-Utils', 'splunk-business-flow', 'splunk_for_vmware', 'SA-VMW-Performance',
                'SA-VMW-LogEventTask', 'SA-VMW-HierarchyInventory', 'SA-Threshold', 'Splunk_DA-ESS_PCICompliance',
                'splunk_app_cloudgateway', 'splunk_app_infrastructure', 'Splunk_TA_opc', 'splunk_app_addon-builder']

# Scan type constants
TYPE_DEPLOYMENT = "deployment"
TYPE_PARTIAL = "partial"
TYPE_SPLUNKBASE = "splunkbase"
TYPE_PRIVATE = "private"

# App type constants
CONST_SPLUNKBASE = "Splunkbase App"
CONST_SPLUNKSUPPORTED = "Splunk Supported App"
CONST_PRIVATE = "Private App"
CONST_SPLUNKBASE_QUAKE = "Splunkbase-Quake"
CONST_SPLUNKBASE_DUAL = "Splunkbase-Dual"
CONST_SPLUNKBASE_UPDATE = "Splunkbase-Update"
CONST_SPLUNKBASE_NONE = "Splunkbase-None"
CONST_PUBLIC = "Public App"

# Compatibility types
CONST_QUAKE = "Quake"
CONST_DUAL = "Dual"
CONST_UPDATE = "Update"
CONST_NONE = "None"

# Export file formats
FILE_FORMAT_JSON = 'json'
FILE_FORMAT_CSV = 'csv'

# App visibility constants
CONST_ENABLED = "ENABLED"
CONST_PREMIUM = "PREMIUM"
CONST_DISABLED = "DISABLED"
CONST_USER_PERM = "USER_PERM"
CONST_ALL_PERM = "ALL_PERM"

# Scan type constants for Telemetry
TELEMETRY_ALL = "All"
TELEMETRY_CUSTOM = "Custom"
TELEMETRY_SPLUNKBASE = "Splunkbase"
TELEMETRY_PRIVATE = "Private"

# Mapping of check name to user-display names
CHECK_NAME_MAPPING = {
    'check_for_existence_of_python_code_block_in_mako_template': 'Python in custom Mako templates',
    'check_for_python_script_existence': 'Python scripts'
}

# Mapping of check name to required action
CHECK_ACTION_MAPPING = {
    'Python in custom Mako templates': 'Check to ensure that Mako templates are upgraded to be compatible with '
                                       'Python 3.',
    'Python scripts': 'Update these Python scripts to be dual-compatible with Python 2 and 3.'
}

# Column headers for CSV report
CSV_REPORT_HEADERS = ["App Name", "App Status", "Source", "Advanced XML Filepath", "CherryPy Endpoint Filepath",
                      "CherryPy Endpoint Syntax", "Python in Mako Templates Filepath",
                      "Python in Mako Templates Syntax", "Removed Libraries Filepath", "Files Named test.py Filepath",
                      "Splunk Web Legacy Mode Filepath", "Other Python Scripts Filepath",
                      "Other Python Scripts Syntax"]

# App Inspect checks result
AI_RESULT_SUCCESS = "success"
AI_RESULT_FAILURE = "failure"
AI_RESULT_ERROR = "error"
AI_RESULT_SKIPPED = "skipped"
AI_RESULT_NA = "not_applicable"
AI_RESULT_MANUAL = "manual_check"
AI_RESULT_WARNING = "warning"

# Constant values for checks
CHECK_CONST_NAME = "check_for_python_script_existence"
CHECK_CONST_PASSED = "PASSED"
CHECK_CONST_BLOCKER = "BLOCKER"
CHECK_CONST_WARNING = "WARNING"
CHECK_CONST_SKIPPED = "SKIPPED"
CHECK_CONST_UNKNOWN = "UNKNOWN"

CHECK_CONST_DESCRIPTION = "Check for the existence of Python scripts, which must be upgraded to be "\
                          "cross-compatible with Python 2 and 3 for the upcoming Splunk Enterprise Python 3 release. "
CHECK_CONST_NOT_APPLICABLE = "N/A"
CHECK_CONST_PYCHECK_MESSAGE = "The file at path {} needs to be checked for Splunk Python 3 migration"

CHECK_CONST_PASSED_MSG = "None"
CHECK_CONST_SKIPPED_MSG = "The Splunk Platform Upgrade Readiness App could not run this check. "\
                          "See the documentation for instructions on how to check the app manually."

# Progress values
PROGRESS_INIT = "INIT"
PROGRESS_NEW = "NEW"
PROGRESS_INPROGRESS = "IN_PROGRESS"
PROGRESS_COMPLETE = "COMPLETE"
PROGRESS_ERROR = "ERROR"

# Messages for response
MESSAGE_NO_PATH_PROVIDED = "No path was provided"
MESSAGE_PATH_NOT_FOUND = "Path was not found"
MESSAGE_FAILED_HANDLE_REQUEST = "Failed to handle request due to an unhandled exception"
MESSAGE_NO_ENTRY_FOUND = "No entry found"
MESSAGE_NO_REQUEST_BODY = "No request body found"
MESSAGE_NO_EMAIL_SUBJECT = "No email subject found"
MESSAGE_NO_EMAIL_RECEIVER = "No email receipient found"
MESSAGE_NO_EMAIL_BODY = "No email body found"
MESSAGE_SEND_EMAIL = "Email sent"
MESSAGE_POST_SCHEDULE_SCAN = "Schedule scan details saved"
MESSAGE_SCAN_CALLED = "Scan Called"
MESSAGE_CHECK_EXISTING_SCAN = "Checking for existing scan"
MESSAGE_NO_EXISTING_SCAN = "No existing scan"
MESSAGE_RETRIEVING_REMOVAL_KEY = "Retrieving key to remove entry"
MESSAGE_FOUND_COMPLETED_KEY = "Found key for completed entry: {}"
MESSAGE_REMOVING_ENTRIES = "Removing existing entries before starting new scan"
MESSAGE_ENTRY_REMOVED = "Entry with key: {} removed"
MESSAGE_ALL_ENTRIES_REMOVED = "All Entries removed"
MESSAGE_SCAN_SUCCESS = "Deployment scanned successfully for user: {}"
MESSAGE_CANCEL_SCAN_SUCCESS = "Scan for user: {} on host: {} cancelled successfully"
MESSAGE_SCAN_CANCELLED = "Cancelled scan for user: {} on host: {}. Please refresh and start again."
MESSAGE_PREVIOUS_RESULTS = "Scan for user: {} on host: {} has been cancelled. Showing last scan results."
MESSAGE_SCANNING_APP = "{} apps out of {} scanned. Scanning App: {}"
MESSAGE_DISMISS_ENTRY_SUCCESS = "File: {} for check: {} for app: {} successfully registered for dismissing for "\
                                "user: {} on host: {}. The fresh scan results would skip this file."
MESSAGE_NO_SCAN_RESULTS = "Starting a new scan"
MESSAGE_SCAN_IN_PROGRESS = "An existing scan is already in progress for user: {} on host:{}"
MESSAGE_TOTAL_APPS_FOUND = "Total {} apps found for user: {}"
MESSAGE_NO_APPS_FOUND = "No apps found for user: {}"
MESSAGE_NO_SPLUNKBASE_APPS_FOUND = "No splunkbase apps found for user: {}"
MESSAGE_NO_PRIVATE_APPS_FOUND = "No private apps found for user: {}"
MESSAGE_EXCEPTION_REST_CALL = "Could not make request to Splunk: {}"
MESSAGE_ERROR_REMOVE_ENTRY = "Error while removing entry for user: {} on host: {}"
MESSAGE_ERROR_EXPORT_REPORT = "Error retrieving scan results for id: {}"
MESSAGE_ERROR_NO_SCAN_ID = "No scan id found. Please select a valid scan report to get results."
MESSAGE_INVALID_FILE_FORMAT = "Invalid file format. Please provide json or csv."
MESSAGE_ERROR_NO_SCAN_TYPE = "No scan type found. Please select a valid scan type."
MESSAGE_INVALID_SCAN_TYPE = "Invalid scan type. Please provide a valid scan type."
MESSAGE_ERROR_FETCHING_APPS = "Error fetching apps for user: {}"
MESSAGE_ERROR_FETCHING_ROLES = "Error fetching roles for user: {}"
MESSAGE_ERROR_READING_PROGRESS = "Error reading progress for user: {} on host: {}"
MESSAGE_ERROR_WRITING_PROGRESS = "Error writing progress for user: {} on host: {}"
MESSAGE_ERROR_CANCEL_SCAN = "Error while cancelling scan for user: {} on host: {}"
MESSAGE_EXCEPTION_THREAD = "Exception while starting the scan process. Please refresh the page and restart the scan."
MESSAGE_ERROR_THREAD = "Error while starting the scan process. Please refresh the page and restart the scan."
MESSAGE_ERROR_READING_SCAN_STATUS = "Error while reading existing scan for user: {} on host:{}"
MESSAGE_EXCEPTION_SCAN_STATUS = "Exception while checking scan status for user: {} on host:{}"
MESSAGE_EXCEPTION_APPLIST = "Exception while loading app list for user: {}"
MESSAGE_EXCEPTION_SCAN_DEPLOYMENT = "Exception while scanning the deployment"
MESSAGE_EXCEPTION_ROLELIST = "Exception while loading role list for user: {}"
MESSAGE_EXCEPTION_WRITE_KVSTORE = "Could not fetch kv store details while writing progress for user: {} on host: {}"
MESSAGE_EXCEPTION_READ_KVSTORE = "Could not fetch kv store details while reading progress for user: {} on host: {}"
MESSAGE_EXCEPTION_DELETE_KVSTORE = "Could not fetch kv store details while cancelling scan for user: {} on host: {}"
MESSAGE_DISMISS_APP_READ_ERROR = "Unable to get app name from request. Please try again."
MESSAGE_DISMISS_CHECK_READ_ERROR = "Unable to get check name from request. Please try again."
MESSAGE_DISMISS_FILEPATH_READ_ERROR = "Unable to get file path from request. Please try again."
MESSAGE_DISMISS_ERROR_FILE_READ = "Unable to fetch existing scan results. Given file entry might reflect in results."
MESSAGE_DISMISS_ERROR_FILE_WRITE = "Cannot update results. Given file entry might reflect in results."
MESSAGE_ERROR_WRITING_DISMISS_ENTRY = "Error writing dismiss file entry for user: {} on host: {}"
MESSAGE_EXCEPTION_WRITING_DISMISS_ENTRY = "Exception while writing dismiss file entry for user: {} on host: {}"
MESSAGE_ERROR_FETCHING_DISMISS_ENTRY = "Error fetching dismiss file entry for user: {} on host: {} for app: {}"
MESSAGE_EXCEPTION_FETCHING_DISMISS_ENTRY = "Exception while fetching dismiss file entry for user: {} on host: {} "\
                                           "for app: {}"
MESSAGE_EXCEPTION_MAKO_FILE_CREATION = "Exception parsing files for Mako templates"
MESSAGE_EXCEPTION_MAKO_FILE_WRITE = "Exception while updating results for Mako templates"
MESSAGE_EXCEPTION_MAKO_FILE_DELETE = "Exception while fetching Mako templates"
MESSAGE_UNAUTHORIZED_SCAN_TERMINATION = "The scan terminated unexpectedly. Please verify the session timeout value "\
                                        "for the user and increase it or rerun the scan with fewer apps."
MESSAGE_UNAUTHORIZED_KV_STORE = "Exception occurred due to invalid permission in reaching KV store. Please verify "\
                                "the session timeout value for the user and increase it or rerun the scan with "\
                                "fewer apps."
MESSAGE_ERROR_CREATING_SESSION_FILE = "Failed to create file for the terminated scan for user: {} on host: {}"
MESSAGE_MAKO_FILE_LINE_NO = "Line number should be a natural number and not conflicting."
MESSAGE_SESSION_FILE_EXISTS = "File at path: {} exists. Exiting scan and returning results"
MESSAGE_ERROR_REMOVING_SESSION_FILE = "Encountered error while removing session file: {}"

MESSAGE_DISMISS_APP_READ_ERROR = "Unable to get app name from request. Please try again."
MESSAGE_DISMISS_APP_PATH_READ_ERROR = "Unable to get app path from request. Please try again."
MESSAGE_DISMISS_APP_ERROR_APP_READ = "Unable to fetch existing scan results. Given app entry might reflect in results."
MESSAGE_DISMISS_APP_ERROR_FILE_WRITE = "Cannot update results. Given application dismiss app entry might reflect in results."
MESSAGE_EXCEPTION_WRITING_DISMISS_APP_ENTRY = "Exception while writing application dismiss app entry for user: {} on host: {}"
MESSAGE_ERROR_WRITING_DISMISS_APP_ENTRY = "Error writing application dismiss app entry for user: {} on host: {}"

MESSAGE_ERROR_FETCHING_DISMISS_APP_ENTRY = "Error fetching application dismiss app entry for user: {} on host: {} for app: {}"
MESSAGE_CHECKSUM_ERROR_FILE_READ = "Unable to fetch existing scan results. The {} app folder will be rescanned."
MESSAGE_DISMISS_APP_ENTRY_SUCCESS = "App: {} successfully registered for dismissing the app for "\
                                "user: {} on host: {}. The periodic notification would skip this dismissed app."
MESSAGE_EXCEPTION_SEND_EMAIL = "Unable to send email: {}"
MESSAGE_ERROR_SEND_EMAIL = "Unable to send email"
MESSAGE_ERROR_GET_REPORT = "Unable to find the latest scan report"
MESSAGE_EXCEPTION_GET_REPORT = "Exception while fetching the latest scan report: {}"
MESSAGE_EXCEPTION_GET_EMAIL_CONFIGURATIONS = "Exception while fetching the email configurations: {}"
MESSAGE_EXCEPTION_GET_APP_REPORT = "Unable to find app: {} in latest report"
MESSAGE_ERROR_GET_EMAIL_CONFIGURATIONS = "Unable to get email configurations"
MESSAGE_ERROR_GET_SCHEDULE_SCAN = "Unable to get schedule scan details"
MESSAGE_ERROR_POST_SCHEDULE_SCAN = "Unable to save schedule scan details"
MESSAGE_EXCEPTION_GET_SCHEDULE_SCAN = "Exception while getting schedule scan details: {}"
MESSAGE_EXCEPTION_READ_SCHEDULE_SCAN_DETAILS = "Could not fetch kv store details while reading schedule scan deatils for user: {} on host: {}"
MESSAGE_EXCEPTION_WRITE_SCHEDULE_SCAN_DETAILS = "Could not fetch kv store details while writing schedule scan deatils for user: {} on host: {}"
MESSAGE_ERROR_WRITE_SCHEDULE_SCAN_DETAILS = "Error writing schedule scan details for user: {} on host: {}"
MESSAGE_ERROR_READ_SCHEDULE_SCAN_DETAILS = "Error reading schedule scan details for user: {} on host: {}"
MESSAGE_INVALID_DAY = "Invalid day value"
MESSAGE_INVALID_HOURS = "Invalid hours value"
MESSAGE_INVALID_MINUTES = "Invalid minutes value"
MESSAGE_INVALID_AM_PM = "Invalid value for am_pm"
MESSAGE_INVALID_SCHEDULE_SCAN_TYPE = "Invalid value for schedule scan type"
MESSAGE_EXCEPTION_CRON_TIME_FORMAT = "Exception while creating cron time format: {}"
MESSAGE_EXCEPTION_SCHEDULE_SCAN_INTERVAL = "Exception while saving schedule scan interval for user: {} on host: {}"
MESSAGE_ERROR_SCHEDULE_SCAN_INTERVAL = "Unable to save schedule scan interval for user: {} on host: {}"
MESSAGE_ERROR_REPORT_PATH_NOT_PRESENT = "Report path is not present"
MESSAGE_EXCEPTION_CLEAR_PASSWORD = "Exception while getting the clear password: {}"
MESSAGE_INVALID_TIMEZONE_OFFSET = "Invalid time zone offset"

MESSAGE_EXCEPTION_FETCHING_DISMISS_APP_ENTRY = 'Exception fetching application dismiss app entry for user: {} on host: {} for app: {}'
MESSAGE_EXCEPTION_GET_CREDENTIALS = "Exception while getting credentials: {}"
MESSAGE_ERROR_VERSION_INFO_NOT_FOUND = "Did not find version information"