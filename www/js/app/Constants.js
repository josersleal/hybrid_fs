var API_VERSION = "v0.6.1";
var API_VALUE_SEPARATOR="___";
var VALUE_YES = "Yes";
var VALUE_NO  = "No";
var VALUE_EMPTY = "";
var NaN = undefined;//Who on earth did this?!?! And why?! But app stop working without this.
var VALUE_SYNC = "Sync";
var VALUE_EXCEPTION = "Throw exception";
var VALUE_ERROR_FETCH =  "Error fetch SFDC data";
var VALUE_ERROR_UPSERT =  "Error Upsert data to SmartStore";
var VALUE_ERROR_SOQL =  "Error SOQL query";
var VALUE_THROW_ERROR =  "Throw error SOQL query";
var VALUE_NO_PARAM_QUERY =  "Warning no parameter query";
var VALUE_DOWNLOAD_LIMIT=  "Download Limit";
var VALUE_NO_FEED = "No Feed";
var VALUE_START = "Start"; 
var VALUE_START_UP = "START"; 
var VALUE_FINISH = "Finish";
var VALUE_ERROR_DOWNLOAD ="Error download";

var VALUE_SAVE_LOCAL = "isLocal";
var VALUE_UPDATED = "Updated";
var VALUE_SAVE_SYNC = "isSync";
var VALUE_ERROR_SYNC = "Error Sync";
var VALUE_START_SYNC = "Starting Sync";
var VALUE_FEED_DATA = "Feed Data";
var VALUE_FEED_OBJECT = "isFeed";
var METHOD_REFRESH_SERVICE_CHATTER_TAB = "RefreshServiceChatterTab";
var VALUE_JOB_TYPE_SINGLE = "SINGLE";
var VALUE_JOB_TYPE_MULTI = "MULTI";
var VALUE_JOB_TYPE_NON = "NO";
var VALUE_NEW_RECORD = "isNew";
var VALUE_NO_RECORDS = "No records";
var ID_HIDDEN = "Id_Hidden";
var HIDDEN_RECORD_ID = "Record Id";
var OPERATION_DESCRIPTION_API = "WRTS_Operation_description__c";
var OPERATION_DESCRIPTION_NAME = "WRTS_Operation_description__c";
var USER_NAME = "User_Name";

var PROFILE_FSMOBILITE = "FS Mobility";
var PROFILE_FSMOBILITE_NO = "FS Mobility - No SSO";
var PROFILE_SYSTEM_ADMIN = "System Administrator";
var PROFILE_FSCOORDINATOR = "FS Coordinator"; 
var PROFILE_FSRESOURCE_PLANNER = "FS Resource Planner";
var PROFILE_FSENGINNER = "FS Engineer";

var FETCH_ATTACHEMENT_HEAD = 'fetch_AttachementsHeader';
var FETCH_CURRENT_USER = "fetch_Current_User";
var FETCH_USERS = "fetch_User";

var NO_SELECTED_OPTION = "-1";

var HIDDEN_NOTES_ID = "Notes Id";
var BREAK_FIELD_NAME = "Breaker"; 
var SFDC_LENGTH_ID = 18;
var OBJECT_TYPE_FEED = "Feed";
var OBJECT_TYPE_FEED_COMMENTS = "FeedComment";
var FIELD_NAME_FSE_NOTE = 'Engineer Notes';
var FIELD_NAME_FSC_NOTE = 'Coordinator Notes';
var FIELD_SERVICE_ORDER_LONG_TEXT ="Description";
var USER_DATA = "User Data";

var FIELD_NAME_PROGRESS = 'Opperation proggres';

var DISPLAY_TYPE_HIDDE = "hidden";
var DISPLAY_TYPE_LINE_BREAK = "line-break";
var DISPLAY_TYPE_SECTION = "section";							
var DISPLAY_TYPE_VALUE_LARGE =  "value-large";
var DISPLAY_TYPE_NORMAL = "normal";

var DOWNLOAD_OFFSET_LIMIT = 2000;

//Type
var TYPE_RESOURCE  = 'Resource';
// Maria Ciskova, 27.7.2015 
var TYPE_TIME_REPORT ='1_TimeReport';
var TYPE_TIME_ENTRY ='2_TimeEntry';
var TYPE_WORK_HOUR ='3_WorkHours';

var TYPE_WORKHOURS ='WorkHours';

//CSS style

var CSS_OPPERATIONS_POPUP_SLIDER= "full-width-slider";

//Text constant in future move to the Translation Manager
var WORK_LOCATION = 'Select a work location';
var WORK_TYPE = 'Select a work type';


var DIV_USER_TAG 										= "p_tag_userName"; 
var DIV_INDEX_PAGE_STATUS 								= "div_soup_status_line";

//--------------WORK HOURS SUB TAB---------------
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP 					= "service-order-popup";
var DIV_SERVICE_ORDER_WORK_HOURS_WEEK 					= "work-hours-popup-date-in-week";
var DIV_SERVICE_ORDER_WORK_HOURS_DATE 					= "work-hours-popup-date";
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP_CONTAINER 		= 'service-order-popup-container';
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE 		= "service-order-popup-work-type";
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE 	= "service-order-popup-location-type";
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES 		= 'service-order-popup-resources';
var TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS 	= "service-order-popup-comments-textarea";
var DIV_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS 		= "service-order-popup-comments-div";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_MINUTES 		= "service-order-popup-minutes";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_HOURS 			= "service-order-popup-hours";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES 	= "service-order-popup-start-minutes";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS 	= "service-order-popup-start-hours";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES 	= "service-order-popup-end-minutes";
var INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS 		= "service-order-popup-end-hours";
var DIV_SERVICE_ORDER_APPROVAL_POPUP_SO_PICKLIST 		= "work-hours-approval-popup-container-so-picklist";
var DIV_SERVICE_ORDER_APPROVAL_POPUP_NAME_INPUT 		= "work-hours-approval-popup-container-name-input";
var DIV_SERVICE_ORDER_APPROVAL_POPUP_EMAIL_INPUT		= "work-hours-approval-popup-container-email-input";
var DIV_SERVICE_ORDER_APPROVAL_POPUP_REMARKS_INPUT 		= "work-hours-approval-popup-container-remarks-input";

var DIV_INDEX_SERVICE_ORDER_LIST 			= "div-soup-service-orders";
var DIV_SERVICE_ORDER_FOOTER 				= "service-order-footer";
var DIV_SERVICE_ORDER_PAGE_STATUS 			= "so_div_soup_status_line";
var DIV_OPERATIONS_DETAIL_DATA 				= "operation-data-popup-detail";
var DIV_OPERATIONSL_DATA 					= "operations-panel";
var DIV_SERVICE_ORDER_PROGRESS_FORM 		= 'div-input-progress';
var DIV_OPERATIONS_PROGRESS_BAR 			= 'operation-input-progress';
var INPUT_OPERATIONS_PROGRESS_BAR 			= 'operations-input-range';
var OPERATION_PROGRESS_TEXT 				= 'operation-progress-text';
var MSG_WARNING 					= "WARNING";
var MSG_INFO 						= "INFO";
var MSG_OK 							= "OK";
var MSG_ERROR 						= "Error";
var DIV_INDEX_FOOTER 				= "index-footer";
var P_SERVICE_ORDER_HEADER_POPUP 	= "header-description";



//Pick List Constant
var WORK_TYPE_NORMLA = 'Normal';
var DEFAULT_FILE_PATH = "file:///sdcard/Wartsila/";
var DOTS = "";
for(var i=0;i<200;i++)
{
    DOTS += ".";
}
var SERVICE_ORDER = "ServiceOrder";
var OPERATION_POPUP = "Operation";
var PAGE_SERVICEORDER="ServiceOrder.html";
var PAGE_OPERATIONS = "Operations.html";
var PAGE_WORKHOURS = "WorkingHours.html";
var PagesLayout = {
	"ServiceOrder" : { Value:"ServiceOrder.html" }
}
var TabPages = {
	"ServiceOrderTabs" : { Value:"ServiceOrderPageLayout.html"},
	"Operation" : { Value:""}
}
var SERVICE_ORDER_TAG_DESC ="service_order_tag_desc";
var SFDC_SYNC_ERROR = "Sorry, couldn't synchronize data, because you have insufficient permissions to Salesforce Objects.\n";
SFDC_SYNC_ERROR += "Please, contact your administrators to check your User Profile or Permission Sets.";

// Labels and Error messages
var NO_SELECTED_WORK_TYPE = "Please select correct Work type";
var NO_SELECTED_LOCATION_TYPE = "Please select correct Work location";
var NO_SELECTED_RESOURCE = "Please select Resource"; 
var NO_SELECTED_MINUTES = "Please correct work minutes";   
var NO_SELECTED_HOURS = "Please correct work hours";
var ERROR_END_TIME_BEFORE_START_TIME = "End time is earlier than start time.";
var ERROR_END_TIME_EQUALS_START_TIME = "End time is same as start time.";
var ERROR_HOURS_EXCEEDED = "You entered more than 23 hours.";
var ERROR_END_OF_DAY_REACHED = "Only 24:00 End Time is supported.";
var ERROR_MINUTES_EXCEEDED = "You entered more than 59 minutes.";
var TEXT_APPLICATION_INIT = "Loading application";