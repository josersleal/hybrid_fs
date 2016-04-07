/*
  @Authors: Juraj Ciljak: juraj.ciljak@accenture.com, Mathias Nyman
  @Description: Object for Database manipulation
  @WARNING: In the SmartStore we are not able do nested SQL like 
  				SELECT Name, (SELECT Name FROM Contact WHERE Contact.AccountID = Account.Id) FROM Account 
  			only left join like
  				SELECT Name FROM Account
  				Left Join Contact ON ......
  			IMPORTANT when you are using Left Join then use COALESCE({SOUP_...:Name},'') in the header of SELECT
  				
  @LastModify: yesterday
*/
//SMART STORE Table
var SOUP_ERROR_LOG						= "ErrorLog";
var SOUP_USER_TABLE 					= "User";

var SOUP_WORK_ORDER 					= "WorkOrder";
var SOUP_WORK_ORDER_FEED 				= "WorkOrder_Feed";
var SOUP_FEEDCOMMNETS 					= "FeedComments";
var SOUP_OPERATION_TABLE 				= "Operation";
var SOUP_ASSIGNED_RESOURCE 				= "AssignedResource";
var SOUP_RESOURCE 						= "Resource";
var SOUP_INSTALLATIONS_TABLE 			= "Installation";
var SOUP_EQUIPMENT_TABLE 				= "Equipment";

var SOUP_SWR_TABLE 						= "SWR"; //Maria Ciskova 24.8.15
var SOUP_SWR_CONTENT_DOC_LINK 			= "SWR_CONT_DOC_LINK"; //Maria Ciskova 21.10.15
var SOUP_SWR_CONTENT_VERSION 			= "SWR_CONT_VERSION"; //Maria Ciskova 21.10.15
var SOUP_TI_ARTICLE_ASSIGNMENT_TABLE 	= "TI_Article_Assignment";//Denis Ivancik 27.8.
var SOUP_TI_ARTICLE_KAV					= "TI_Article_kav";//M.C. 26.2.2016

var SOUP_FSE_NOTES 						= "FSE_Note__c";//Engineer Notes for Operations
var SOUP_FS_COORDINATOR_NOTES 			= "FS_Coordinator_Note__c";
var SOUP_SALES_ORDER 					= "SalesOrder";
var SOUP_SPARE_PARTS 					= "SpareParts";

var SOUP_JOB_SAFETY_ANALYSIS_TABLE 		= "Job_Safety_Analysis";
var SOUP_JOB_SAFETY_ANALYSIS_FEED 		= "Job_Safety_Analysis_feed";
var SOUP_INCIDENT_TABLE 				= "Incident";
var SOUP_JSA_ACTIVITIES_TABLE 			= "jsa_activities_table";

var SOUP_DOC_TABLE 						= "Documents";
var SOUP_BATCH_TEMP_TABLE 				= "TempFeed"; // Table for temporary stored Id
var SOUP_BATCH_TEMP_ATTACHEMENT_TABLE 	= "TempAttachement"; // Table for temporary stored Id

var SOUP_TIME_REPORT 					= "Time_Report";
var SOUP_TIME_ENTRY 					= "Time_Entry";
var SOUP_WORK_HOURS 					= "Work_Hours";
var SOUP_APPROVALS 						= "Approvals";

var SOUP_TASK							= "Task";

// Salesforce Objects
var SFDC_USER 							= "User";
var SFDC_ATTACHEMENT					= "Attachment";
var SFDC_FEED_ITEM						= "FeedItem";
var SFDC_FEEDCOMMNETS					= "FeedComments";
var SFDC_WORK_ORDER_FEED				= "CKSW__WorkOrder__Feed";

var SFDC_WORK_ORDER						= "CKSW__WorkOrder__c";
var SFDC_OPERATIONS						= "CKSW__Task__c";/*the commented API name is for DEV sandbox*/
var SFDC_ASSIGNED_RESOURCE				= "WRTS_Task_Assigned_Resource__c";/*"Task_Assigned_Resource__c";*/
//var SFDC_ASSIGNED_RESOURCE				= "Task_Assigned_Resource__c";
var SFDC_RESOURCE						= "CKSW__Engineer_Equipment__c";
var SFDC_INSTALLATIONS					= "Installation__c";
var SFDC_EQUIPMENTS						= "Equipment__c";

var SFDC_SALES_ORDER					= "Open_Sales_Order__c";
var SFDC_SPARE_PARTS					= "LineItem__c";
var SFDC_FS_COORDINATOR_NOTES			= "FS_Coordinator_Note__c";
var SFDC_FSE_NOTES						= "FSE_Note__c";

var SFDC_TI_ARTICLE_ASSIGNMENT			= "TI_Article_Assignment__c";
var SFDC_TI_ARTICLE_KAV					= "TI_Article__kav";
var SFDC_SWR							= "Service_Work_Report__c";
var SFDC_CONTENT_DOCUMENT				= "ContentDocument";
var SFDC_CONTENT_DOCUMENT_LINK			= "ContentDocumentLink";
var SFDC_CONTENT_VERSION				= "ContentVersion";

var SFDC_TIME_REPORT					= "Time_Report__c";
var SFDC_TIME_ENTRY						= "Time_Entry__c";
var SFDC_WORK_HOURS						= "Work_Hours__c";
var SFDC_APPROVALS						= "Time_Sheet";
var SFDC_SYNC_TABLE						= 'SyncMobileData__c';

var SFDC_JOB_SAFETY_ANALYSIS			= "Job_Safety_Analysis__c";
var SFDC_JOB_SAFETY_ANALYSIS_FEED 		= "Job_Safety_Analysis__feed";
var SFDC_INCIDENT						= "Incident__c";
var SFDC_JSA_ACTIVITIES					= "JSA_Activity__c";

var SFDC_TASK							= "Task";
//JobTable Status
var OFFSET_LIMIT = "OFFSET Limit";

//Table definition
var SQLTable =
{
	"ALT_SOQL_CURRENT_USER" : {
					SQL:" SELECT Id,Name,Email,TimeZoneSidKey FROM "+SFDC_USER,
					WHERE:" WHERE (Id = ':PRuserId') ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_USER,
					SOUP_TABLE: SOUP_USER_TABLE 
				},

	"ALT_USER_RES" : {
					SQL:" SELECT u.{"+SOUP_USER_TABLE+":Id}"+
						" FROM {"+SOUP_USER_TABLE+"} as u ",
					WHERE:"",
					ORDERBY:"",
					LIMIT:2000,
					RELATED_SQL:"ALT_SOQL_USER_RES",
					REPLACE_COLUMN :"CKSW__User__c",
					TABLE: SFDC_RESOURCE,
					SOUP_TABLE: SOUP_RESOURCE
				},

	"ALT_SOQL_USER_RES" : {
					SQL:" SELECT Id,Name,CreatedDate,CreatedById,CKSW__User__c FROM "+SFDC_RESOURCE,
					WHERE:" WHERE (CKSW__Type__c!='Tool') AND (CKSW__Type__c!='Engine/Simulator/Classroom') AND (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					REPLACE_COLUMN :"CKSW__User__c",
					RELATED_SQL:"",
					TABLE: SFDC_RESOURCE,
					SOUP_TABLE: SOUP_RESOURCE
				},

	"ALT_RES_OAR" : {
					SQL:" SELECT r.{"+SOUP_RESOURCE+":Id}"+
						" FROM {"+SOUP_RESOURCE+"} as r ",
					WHERE:"",
					ORDERBY:"",
					LIMIT:500,
					RELATED_SQL:"ALT_SOQL_RES_OAR",
					REPLACE_COLUMN :"Resource__c",
					TABLE: SFDC_ASSIGNED_RESOURCE,
					SOUP_TABLE: SOUP_ASSIGNED_RESOURCE
				},

	"ALT_SOQL_RES_OAR" : {
					SQL:" SELECT Id, Task__c, Resource__c FROM "+SFDC_ASSIGNED_RESOURCE,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					REPLACE_COLUMN :"Resource__c",
					RELATED_SQL:"",
					TABLE: SFDC_ASSIGNED_RESOURCE,
					SOUP_TABLE: SOUP_ASSIGNED_RESOURCE
				},

	//Maria 19.1.2016 Task Assigned Resources new download queries
	"SQLITE_ALT_OPERATION_TAR":{
					SQL:" SELECT {"+SOUP_ASSIGNED_RESOURCE+":Task__c}"+
						" FROM {"+SOUP_ASSIGNED_RESOURCE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_ALT_OPERATIONS",
					REPLACE_COLUMN :"Id",
					TABLE: "",
					SOUP_TABLE: SOUP_OPERATION_TABLE //this specifies to what table are operations saved
					},

	"SOQL_ALT_OPERATIONS" : {
					SQL:" SELECT CKSW__WorkOrder__c,WRTS_Operation_description__c,Name,WRTS_Operation_Progress__c,LastModifiedDate,"+
						" OperationFullId__c, WRTS_Total_Duration__c,WRTS_Total_Duration_unit__c,CKSW__Assignment_Start_Date__c,"+
						" CKSW__Assignment_Finish_Date__c, WRTS_Operation_Line_number__c,CKSW__Notes__c, CKSW__Assigned_Resource__c,"+
						" Id,FSMobile_AssignedResource_UserId__c, CKSW__Due_Date_Date__c, CKSW__Early_Start_Date__c, CKSW__City__c,"+
						" CKSW__Country__c FROM "+SFDC_OPERATIONS ,
					WHERE:" WHERE (isDeleted=false) AND ( :PRIds ) AND (CKSW__IsReadyForSchedule__c=true) ",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Id",
					TABLE: SFDC_OPERATIONS,
					SOUP_TABLE: SOUP_OPERATION_TABLE
				},
	
	"SQLITE_ALT_SERVICE_ORDER_OPERATION_BATCH":{
					SQL:" SELECT {"+SOUP_OPERATION_TABLE+":CKSW__WorkOrder__c}"+
						" FROM {"+SOUP_OPERATION_TABLE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_ALT_SERVICE_ORDER",
					REPLACE_COLUMN :"Id",
					TABLE: "",
					SOUP_TABLE: SOUP_WORK_ORDER //this specifies to what table are operations saved
					},

	"SOQL_ALT_SERVICE_ORDER" : {
					SQL:" SELECT Name, Id, WRTS_Equipment_ID__c, CKSW__Account__c, WRTS_Installation_ID__c, CreatedDate, "+
						" Contact_Person_At_Site__c, CKSW__End_Date_Date__c, WRTS_Coordinator_Name__c, WRTS_SAP_Order_ID__c, "+
						" WRTS_Contact_Person_Phone__c, WRTS_Notification_Description__c, CKSW__Description__c, "+
						" CKSW__Start_Date_Date__c, WRTS_Contact_Person_Name__c, "+// General_Remarks__c, WRTS_Internal_Comments__c,
						" WRTS_Contact_Person_Email__c, WRTS_Installation_ID__r.Name, "+//FSM_SignatureJSON__c, 
						" FSM_Signature__c, WRTS_Cordinator_name__c FROM "+SFDC_WORK_ORDER+" ",
					WHERE:" WHERE (isDeleted=false) AND ( :PRIds ) AND (CKSW__Status__c !='Completed') AND (CKSW__Status__c !='Cancel')",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Id",
					TABLE: SFDC_WORK_ORDER,
					SOUP_TABLE: SOUP_WORK_ORDER
				},

	"SQLITE_ALT_TAR_OPERATION_BATCH" : {
					SQL:" SELECT {"+SOUP_OPERATION_TABLE+":Id}"+
						" FROM {"+SOUP_OPERATION_TABLE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					RELATED_SQL:"SOQL_ALT_ALL_TAR",
					REPLACE_COLUMN :"Task__c",
					TABLE: SFDC_ASSIGNED_RESOURCE,
					SOUP_TABLE: SOUP_ASSIGNED_RESOURCE
				},

	"SOQL_ALT_ALL_TAR" : {
					SQL:" SELECT Id, Task__c, Resource__c FROM "+SFDC_ASSIGNED_RESOURCE,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					REPLACE_COLUMN :"Task__c",
					RELATED_SQL:"",
					TABLE: SFDC_ASSIGNED_RESOURCE,
					SOUP_TABLE: SOUP_ASSIGNED_RESOURCE
				},

	"SQLITE_ALT__RESOURCE_TAR_BATCH" : {
					SQL:" SELECT {"+SOUP_ASSIGNED_RESOURCE+":Resource__c}"+
						" FROM {"+SOUP_ASSIGNED_RESOURCE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					RELATED_SQL:"SOQL_ALT_ALL_RESOURCES",
					REPLACE_COLUMN :"Id",
					TABLE: SFDC_RESOURCE,
					SOUP_TABLE: SOUP_RESOURCE
				},

	"SOQL_ALT_ALL_RESOURCES" : {
					SQL:" SELECT Id,Name,CreatedDate,CreatedById,CKSW__User__c FROM "+SFDC_RESOURCE,
					WHERE:" WHERE (CKSW__Type__c!='Tool') AND (CKSW__Type__c!='Engine/Simulator/Classroom') AND (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					REPLACE_COLUMN :"Id",
					RELATED_SQL:"",
					TABLE: SFDC_RESOURCE,
					SOUP_TABLE: SOUP_RESOURCE
				},

	"SQLITE_GET_CURRENT_USER_DATA" : {
					SQL:" SELECT u.{"+SOUP_USER_TABLE+":_soup}"+
						" FROM {"+SOUP_USER_TABLE+"} as u ",
					WHERE:" WHERE u.{"+SOUP_USER_TABLE+":Id} =':RecordId'",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "", 
					SOUP_TABLE: SOUP_USER_TABLE
				},

	"SQLITE_OPERATIONS_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":Id}"+
						" FROM {"+SOUP_WORK_ORDER+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_OPERATIONS",
					REPLACE_COLUMN :"CKSW__WorkOrder__c",
					TABLE: SFDC_OPERATIONS,
					SOUP_TABLE: SOUP_OPERATION_TABLE
					},

	"SOQL_OPERATIONS" : {
					SQL:" SELECT CKSW__WorkOrder__c,WRTS_Operation_description__c,Name,WRTS_Operation_Progress__c,LastModifiedDate,"+
						" OperationFullId__c, WRTS_Total_Duration__c,WRTS_Total_Duration_unit__c,CKSW__Assignment_Start_Date__c,"+
						" CKSW__Assignment_Finish_Date__c, WRTS_Operation_Line_number__c,CKSW__Notes__c, CKSW__Assigned_Resource__c,"+
						" Id,FSMobile_AssignedResource_UserId__c, CKSW__Due_Date_Date__c, CKSW__Early_Start_Date__c,CKSW__City__c,"+
						" CKSW__Country__c FROM "+SFDC_OPERATIONS ,
					WHERE:" WHERE (isDeleted=false) AND ( :PRIds ) AND (CKSW__IsReadyForSchedule__c=true) ",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"CKSW__WorkOrder__c",
					TABLE: SFDC_OPERATIONS,
					SOUP_TABLE: SOUP_OPERATION_TABLE
				},

	"SQLITE_INSTALLATIONS_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c}"+
						" FROM {"+SOUP_WORK_ORDER+"}",
					WHERE:" WHERE COALESCE({"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c},'') !='' "+
						  " GROUP BY  {"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_INSTALLATIONS",
					REPLACE_COLUMN :"Id",
					TABLE: SFDC_INSTALLATIONS,
					SOUP_TABLE: SOUP_INSTALLATIONS_TABLE
				},

	"SOQL_INSTALLATIONS" : {
					SQL:" SELECT Id, Name, Installation_Type__c,"+//SUPERIOR_FUNCTIONAL_LOCATION__c, 
						" Country_of_Registration__c, Country_of_Operation__c, Classification_Society__c,"+
						" SUPERIOR_FUNCTIONAL_LOCATION__r.Name,"+// SUPERIOR_FUNCTIONAL_LOCATION__r.SERVICES_AM_ID__c,
						" SUPERIOR_FUNCTIONAL_LOCATION__r.SERVICES_AM_ID__r.Name, SUPERIOR_FUNCTIONAL_LOCATION__r.SERVICES_AM_ID__r.Phone,"+
						" SUPERIOR_FUNCTIONAL_LOCATION__r.SERVICES_AM_ID__r.Email, SUPERIOR_FUNCTIONAL_LOCATION__r.S_Customer_Value_Category__c,"+
						" LR_IMO_Ship_ID__c, Installation_Cluster__c FROM "+SFDC_INSTALLATIONS,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Id",
					TABLE: SFDC_INSTALLATIONS,
					SOUP_TABLE: SOUP_INSTALLATIONS_TABLE
				},

	"SQLITE_EQUIPMENTS_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_INSTALLATIONS_TABLE+":Id}"+
						" FROM {"+SOUP_INSTALLATIONS_TABLE+"}",
					WHERE:" WHERE {"+SOUP_INSTALLATIONS_TABLE+":Installation_Cluster__c}!='Stock' LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_EQUIPMENTS",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_EQUIPMENTS,
					SOUP_TABLE: SOUP_EQUIPMENT_TABLE
				},

	"SOQL_EQUIPMENTS" : {
					SQL:" SELECT Id,Name,Equipment_Text__c,Installation__c,Equipment_Category__c FROM "+SFDC_EQUIPMENTS,
					WHERE:" WHERE (IsDeleted=false)"+
						  " AND ( :PRIds ) ",
					ORDERBY:" ORDER BY Name Asc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_EQUIPMENTS,
					SOUP_TABLE: SOUP_EQUIPMENT_TABLE
				},
	//MC 4.2.2016
	"SQLITE_TASKS_EQUIPMENTS_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_EQUIPMENT_TABLE+":Id}"+
						" FROM {"+SOUP_EQUIPMENT_TABLE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_TASKS",
					REPLACE_COLUMN :"WhatId",
					TABLE: SFDC_TASK,
					SOUP_TABLE: SOUP_TASK
				},

	"SOQL_TASKS" : {
					SQL:" SELECT Id,WhatId,ActivityDate,Status,Subject,CreatedById,Description,Owner.Name,CreatedBy.Name,"+
						" Reason_for_Rejection__c,Sub_Status__c, CreatedDate"+
						" FROM "+SFDC_TASK,
					WHERE:" WHERE (IsDeleted=false) AND (CreatedDate >= LAST_N_MONTHS:24 ) "+
						  " AND ( :PRIds ) "+
						  " AND (RecordType.DeveloperName = 'FSM_Task_to_Lead')",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"WhatId",
					TABLE: SFDC_TASK,
					SOUP_TABLE: SOUP_TASK
				},

	"SQLITE_JOB_SAFETY_ANALYSIS_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":Id}"+
						" FROM {"+SOUP_WORK_ORDER+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_JOB_SAFETY_ANALYSIS",
					REPLACE_COLUMN :"Service_Order__c",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_TABLE
				},

	"SOQL_JOB_SAFETY_ANALYSIS" : {
					SQL:"SELECT Id, Service_Order__c, Asbestos_Free_Certificate_Declaration__c, Dangerous_Goods_Storage__c, " + 
						"Emergency_Routes_and_Exits__c, Firefighting_quipment__c, General_Housekeeping_Work_Environment__c, " + 
						"Other_Hazardous_Materials__c, Scaffolding_Certificate__c, State_of_Electrical_Systems__c, State_of_Hydraulic_Equipments__c, " + 
						"Ventilation_Conditions__c, Waste_management__c, lifting_hoisting_equipment__c, Installation_EHS_conditions_notes__c, " + 
						"Engine_specific_tools__c, LastModifiedDate FROM " + SFDC_JOB_SAFETY_ANALYSIS,
					WHERE:"WHERE ( :PRIds )",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_TABLE
				},

	"SQLITE_SALES_ORDER_INSTALLATIONS_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_INSTALLATIONS_TABLE+":Id}"+
						" FROM {"+SOUP_INSTALLATIONS_TABLE+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_INSTALLATIONS_TABLE+":Id},'') !='' AND {"+SOUP_INSTALLATIONS_TABLE+":Installation_Cluster__c}!='Stock'"+
						  " GROUP BY {"+SOUP_INSTALLATIONS_TABLE+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_SALES_ORDER",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_SALES_ORDER,
					SOUP_TABLE: SOUP_SALES_ORDER
				},

	"SOQL_SALES_ORDER" : {
					SQL:" SELECT Id,Overall_Delivery_Status__c,Installation__c,Orderer_Name__c,Portal_created_date__c, Name FROM  "+SFDC_SALES_ORDER ,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds )"+
						  " AND ( Portal_created_date__c >= LAST_N_MONTHS:3 ) AND (:PRIds) ",
					ORDERBY:" ORDER BY CreatedDate Desc	 ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_SALES_ORDER,
					SOUP_TABLE: SOUP_SALES_ORDER
				},

	"SQLITE_SPARE_PARTS_SALES_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_SALES_ORDER+":Id}"+
						" FROM {"+SOUP_SALES_ORDER+"}",
					WHERE:" WHERE COALESCE({"+SOUP_SALES_ORDER+":Id},'') !='' "+
						" GROUP BY {"+SOUP_SALES_ORDER+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_SPARE_PARTS",
					REPLACE_COLUMN :"Sales_Order__c",
					TABLE: SFDC_SPARE_PARTS,
					SOUP_TABLE: SOUP_SPARE_PARTS
				},

	"SOQL_SPARE_PARTS" : {
					SQL:" SELECT Id, Name, Quantity__c, codeNumber__c, materialNumberDescription__c, "+
					//"Internal_Material_Description__c" // not jet migrated
						" Sales_Order__c, materialNumber__c FROM  "+SFDC_SPARE_PARTS ,
					WHERE:" WHERE (IsDeleted=false) AND (:PRIds)",
					ORDERBY:" ORDER BY CreatedDate Desc	 " ,
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Sales_Order__c",
					TABLE: SFDC_SPARE_PARTS,
					SOUP_TABLE: SOUP_SPARE_PARTS
				},

	"SQLITE_FSE_NOTES_OPERATIONS_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_OPERATION_TABLE+":Id}"+
						" FROM {"+SOUP_OPERATION_TABLE+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_OPERATION_TABLE+":Id},'') !='' "+
						  " GROUP BY  {"+SOUP_OPERATION_TABLE+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_FSE_NOTES",
					REPLACE_COLUMN :"Operation__c",
					TABLE: SFDC_FSE_NOTES,
					SOUP_TABLE: SOUP_FSE_NOTES
				},

	"SOQL_FSE_NOTES":{
					SQL:" SELECT Id,Name, Notes__c, CreatedDate,Operation__c, CreatedById, LastModifiedDate,FS_Mobility_ExternalId__c "+
						" FROM "+SFDC_FSE_NOTES+" ",
					WHERE:" WHERE (IsDeleted=false) AND ( CreatedDate >= LAST_N_MONTHS:3 )"+
						  " AND (Operation__c!=null) AND (:PRIds)",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Operation__c",
					TABLE: SFDC_FSE_NOTES,
					SOUP_TABLE: SOUP_FSE_NOTES
				},

	"SQLITE_FS_COORDINATOR_NOTES_OPERATIONS_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_OPERATION_TABLE+":Id}"+
						" FROM {"+SOUP_OPERATION_TABLE+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_OPERATION_TABLE+":Id},'') !='' "+
						  " GROUP BY  {"+SOUP_OPERATION_TABLE+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_FS_COORDINATOR_NOTES",
					REPLACE_COLUMN :"Operation__c",
					TABLE: SFDC_FS_COORDINATOR_NOTES,
					SOUP_TABLE: SOUP_FS_COORDINATOR_NOTES
				},

	"SOQL_FS_COORDINATOR_NOTES":{
					SQL:" SELECT Id,Name, Operation__c, Title__c, Text__c "+
						" FROM "+SFDC_FS_COORDINATOR_NOTES+" ",
					WHERE:" WHERE (IsDeleted=false) AND  ( CreatedDate >= LAST_N_MONTHS:3 )"+
						  " AND (Operation__c!=null) AND (:PRIds)",
					ORDERBY:" ORDER BY CreatedDate Desc " ,
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Operation__c",
					TABLE: SFDC_FS_COORDINATOR_NOTES,
					SOUP_TABLE: SOUP_FS_COORDINATOR_NOTES
				},

	"SQLITE_TIME_REPORT_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":Id}"+
						" FROM {"+SOUP_WORK_ORDER+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_WORK_ORDER+":Id},'') !='' "+
						  " GROUP BY {"+SOUP_WORK_ORDER+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_TIME_REPORT",
					REPLACE_COLUMN :"Service_Order__c",
					TABLE: SFDC_TIME_REPORT,
					SOUP_TABLE: SOUP_TIME_REPORT
				},

	"SOQL_TIME_REPORT" : {
					SQL:" SELECT Id,Name,CreatedDate,CreatedById,Report_Date__c,Service_Order__c, FS_Mobility_ExternalId__c from "+SFDC_TIME_REPORT,
					WHERE:" WHERE (IsDeleted=false)"+
						  " AND  ( :PRIds ) ",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Service_Order__c",
					TABLE: SFDC_TIME_REPORT,
					SOUP_TABLE: SOUP_TIME_REPORT
				},

	"SQLITE_TIME_ENTRY_TIME_REPORT_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_TIME_REPORT+":Id}"+
						" FROM {"+SOUP_TIME_REPORT+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_TIME_REPORT+":Id},'') !='' "+
						  " GROUP BY  {"+SOUP_TIME_REPORT+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_TIME_ENTRY",
					REPLACE_COLUMN :"Time_Report__c",
					TABLE: SFDC_TIME_ENTRY,
					SOUP_TABLE: SOUP_TIME_ENTRY
				},

	"SOQL_TIME_ENTRY" : {
					SQL:" SELECT Id,Name,CreatedDate,CreatedById,Resource__c,Time_Report__c, FS_Mobility_ExternalId__c from "+SFDC_TIME_ENTRY,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds ) ",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Time_Report__c",
					TABLE: SFDC_TIME_ENTRY,
					SOUP_TABLE: SOUP_TIME_ENTRY
				},

	"SQLITE_WORK_HOURS_TIME_ENTRY_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_TIME_ENTRY+":Id}"+
						" FROM {"+SOUP_TIME_ENTRY+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_TIME_ENTRY+":Id},'') !='' "+
						  " GROUP BY  {"+SOUP_TIME_ENTRY+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_WORK_HOURS",
					REPLACE_COLUMN :"Time_Entry__c",
					TABLE: SFDC_WORK_HOURS,
					SOUP_TABLE: SOUP_WORK_HOURS
				},

	"SOQL_WORK_HOURS" : {
					SQL:" SELECT Id, Name, CreatedDate, CreatedById, Reported_Hours__c, Time_Entry__c, Comments__c,"+
						" Type__c, Approved__c, Start_Time__c, End_Time__c, Location__c, FS_Mobility_ExternalId__c from "+SFDC_WORK_HOURS,
					WHERE:" WHERE (IsDeleted=false)"+
						  " AND ( :PRIds ) AND (Approved__c = false) ",
					ORDERBY:" ORDER BY CreatedDate Desc	" ,
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Time_Entry__c",
					TABLE: SFDC_WORK_HOURS,
					SOUP_TABLE: SOUP_WORK_HOURS
				},

	"SQLITE_WORK_ORDER_FEED_BATCH" : {
					SQL:" SELECT {"+SOUP_WORK_ORDER+":Id}"+
						" FROM {"+SOUP_WORK_ORDER+"}",
					WHERE:" WHERE COALESCE({"+SOUP_WORK_ORDER+":Id},'') !='' LIMIT :OFFSET,:LIMIT",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_SQLITE_BATCH_WO_FEED",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_WORK_ORDER_FEED,
					SOUP_TABLE:SOUP_WORK_ORDER_FEED
				},

	"SOQL_SQLITE_BATCH_WO_FEED":{
					SQL:" SELECT InsertedById, Visibility, Type, Title, ParentId, LinkUrl, LikeCount, Id, CreatedDate, ContentType, "+
						" ContentSize, ContentFileName, ContentDescription, CommentCount, Body,CreatedBy.Name, "+
						" (SELECT Id, FeedItemId, ParentId, CreatedDate, CommentBody, IsDeleted, CommentType,CreatedById,CreatedBy.Name,"+
						" RelatedRecordId FROM " + SFDC_FEEDCOMMNETS + " WHERE isDeleted = false) FROM " + SFDC_WORK_ORDER_FEED + " ",
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds ) ",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_WORK_ORDER_FEED,
					SOUP_TABLE: SOUP_WORK_ORDER_FEED 
				},

	"SQLITE_WO_FEED_BODY_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER_FEED+":Id}, {"+SOUP_WORK_ORDER_FEED+":ContentFileName}"+
						" FROM {"+SOUP_WORK_ORDER_FEED+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_WORK_ORDER_FEED+":Id},'') !='' AND {"+SOUP_WORK_ORDER_FEED+":ContentSize}>0 "+
						  " GROUP BY  {"+SOUP_WORK_ORDER_FEED+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ContentData",
					TABLE: SFDC_WORK_ORDER_FEED,
					SOUP_TABLE: SOUP_WORK_ORDER_FEED
				},

	"SQLITE_JSA_FEED_BATCH" : {
					SQL:"SELECT {" + SOUP_JOB_SAFETY_ANALYSIS_TABLE + ":Id}" +
						" FROM {" + SOUP_JOB_SAFETY_ANALYSIS_TABLE + "}",
					WHERE:" WHERE COALESCE({"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+":Id},'') !='' LIMIT :OFFSET,:LIMIT",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_SQLITE_BATCH_JSA_FEED",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS_FEED,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_FEED
				},

	"SOQL_SQLITE_BATCH_JSA_FEED":{
					SQL:" SELECT InsertedById, Visibility, Type, Title, ParentId, LinkUrl, LikeCount, Id, CreatedDate, ContentType, "+
						" ContentSize, ContentFileName, ContentDescription, CommentCount, Body, CreatedBy.Name,"+
						" (SELECT Id, FeedItemId, ParentId, CreatedDate, CommentBody, IsDeleted, CommentType,CreatedById,CreatedBy.Name,"+
						" RelatedRecordId FROM " + SFDC_FEEDCOMMNETS + " WHERE isDeleted = false) FROM " + SFDC_JOB_SAFETY_ANALYSIS_FEED + " ",
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds ) ",
					ORDERBY:" ORDER BY CreatedDate Desc ",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS_FEED,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_FEED 
				},

	"SQLITE_JSA_FEED_BODY_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":Id}, {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":ContentFileName}"+
						" FROM {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":Id},'') !='' AND {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":ContentSize}>0 "+
						  " GROUP BY  {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":Id} LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ContentData",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS_FEED,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_FEED
				},

	"SQLITE_JSA_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":Id}"+
						" FROM {"+SOUP_WORK_ORDER+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_JSA_ACTIVITIES",
					REPLACE_COLUMN :"Job_Safety_Analysis__r.Service_Order__c",
					TABLE: SFDC_JSA_ACTIVITIES,
					SOUP_TABLE: SOUP_JSA_ACTIVITIES_TABLE
				},

	"SOQL_JSA_ACTIVITIES" : {
					SQL:" SELECT Id, Job_Safety_Analysis__c, Job_Safety_Analysis__r.Service_Order__c,"+
						" JSA_Activity__c.Approved__c, RA_Activity__r.Precaution_notes__c, RA_Activity__r.Short_Activity_Title__c," +
						" RA_Activity__r.Tools__c, RA_Activity__r.Permits__c, RA_Activity__r.PPEs__c, RA_Activity__r.Hazards__c, RA_Activity__r.Hazard_Descriptions1__c, " +
						" RA_Activity__r.Hazard_Descriptions2__c, RA_Activity__r.Display_Order__c, Count_of_Injuries__c, Count_of_Near_Misses__c FROM " + SFDC_JSA_ACTIVITIES,
					WHERE:" WHERE ( :PRIds )",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_JSA_ACTIVITIES,
					SOUP_TABLE: SOUP_JSA_ACTIVITIES_TABLE
				},

	"SQLITE_SWR_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_INSTALLATIONS_TABLE+":Id}"+
						" FROM {"+SOUP_INSTALLATIONS_TABLE+"}", 
					WHERE:" WHERE {"+SOUP_INSTALLATIONS_TABLE+":Installation_Cluster__c}!='Stock' LIMIT :OFFSET,:LIMIT",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_SWR",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_SWR,
					SOUP_TABLE: SOUP_SWR_TABLE
				},

	"SOQL_SWR" : {
					SQL:" SELECT ID, Name, Installation__c, Service_Work_Report_Name__c, Service_Order_ID__c "+
					    " FROM " + SFDC_SWR ,
					WHERE:" WHERE (isDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Installation__c",
					TABLE: SFDC_SWR,
					SOUP_TABLE: SOUP_SWR_TABLE
				},

	"SQLITE_TI_ARTICLE_ASSIGNMENT_BATCH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER+":WRTS_Equipment_ID__c}"+
						" FROM {"+SOUP_WORK_ORDER+"} ",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_TI_ARTICLE_ASSIGNMENT",
					REPLACE_COLUMN :"TI.Equipment__c",
					TABLE: SFDC_TI_ARTICLE_ASSIGNMENT,
					SOUP_TABLE: SOUP_TI_ARTICLE_ASSIGNMENT_TABLE
				},

	"SOQL_TI_ARTICLE_ASSIGNMENT" : {
					SQL:" SELECT Id, Name, Title__c, Article_Version_Id__c, Installation__c, Equipment__c, Document_Type__c, Binder__c "+
						" FROM " + SFDC_TI_ARTICLE_ASSIGNMENT + " TI ",
					WHERE:" WHERE (:PRIds) ",// AND TI.Document_Type__c!=null
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"TI.Equipment__c",
					RELATED_SQL:"",
					TABLE: SFDC_TI_ARTICLE_ASSIGNMENT,
					SOUP_TABLE: SOUP_TI_ARTICLE_ASSIGNMENT_TABLE
				},
	//M.C. 26.2. download TI Article kav info without blob
	"SQLITE_TI_ARTICLE_KAV_TIA_ASSIGNMENT_BATCH":{
					SQL:" SELECT {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Article_Version_Id__c}"+
						" FROM {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+"} ",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_TI_ARTICLE_KAV",
					REPLACE_COLUMN :"TI.Article_Version_Id__c",
					TABLE: SFDC_TI_ARTICLE_KAV,
					SOUP_TABLE: SOUP_TI_ARTICLE_KAV
				},

	"SOQL_TI_ARTICLE_KAV" : {
					SQL:" SELECT Id, Date__c, SubType__c, Title, Bulletin_Document__Name__s, PDF_File__Name__s,"+
						" HTML_File__Name__s, Article_Version_Id__c, Main_Type__c "+ 					
						" FROM " + SFDC_TI_ARTICLE_KAV + " TI ",
					WHERE:" WHERE Language='en_GB' AND PublishStatus = 'Online' AND (:PRIds) ",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"TI.Article_Version_Id__c",
					RELATED_SQL:"",
					TABLE: SFDC_TI_ARTICLE_KAV,
					SOUP_TABLE: SOUP_TI_ARTICLE_KAV
				},

	"SQLITE_ATTACHEMENT_WORK_ORDER_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_BATCH_TEMP_ATTACHEMENT_TABLE+":Id}"+
						" FROM {"+SOUP_BATCH_TEMP_ATTACHEMENT_TABLE+"}", 
					WHERE:" WHERE COALESCE({"+SOUP_BATCH_TEMP_ATTACHEMENT_TABLE+":Id},'') !='' LIMIT :OFFSET,:LIMIT",
					ORDERBY:" " ,
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_ATTACHEMENT",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_ATTACHEMENT,
					SOUP_TABLE: SOUP_DOC_TABLE
				},

	"SOQL_ATTACHEMENT" : {
					SQL:" SELECT ParentId, Name, Id, ContentType FROM "+SFDC_ATTACHEMENT,
					WHERE:" WHERE (IsDeleted=false) AND ( :PRIds )",
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ParentId",
					TABLE: SFDC_ATTACHEMENT,
					SOUP_TABLE: SOUP_DOC_TABLE
				},

	"SQLITE_ATTACHEMENT_BODY_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_DOC_TABLE+":Id}, {"+SOUP_DOC_TABLE+":Name}"+
						" FROM {"+SOUP_DOC_TABLE+"}", 
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"Body",
					TABLE: SFDC_ATTACHEMENT,
					SOUP_TABLE: SOUP_DOC_TABLE
				},
				
	"SQLITE_INCIDENT_INSTALLATION_BATCH" :{
					SQL:" SELECT {"+SOUP_INSTALLATIONS_TABLE+":Id}"+
						" FROM {"+SOUP_INSTALLATIONS_TABLE+"}",
					WHERE:" LIMIT :OFFSET,:LIMIT ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_INCIDENTS",
					REPLACE_COLUMN :"JSA_Activity__r.Job_Safety_Analysis__r.Service_Order__r.WRTS_Installation_ID__c",
					TABLE: SFDC_INCIDENT,
					SOUP_TABLE: SOUP_INCIDENT_TABLE
				},

	"SOQL_INCIDENTS" : {
					SQL:" SELECT Id, CreatedDate, CreatedById, Incident_Summary__c, Incident_type__c, " +
					" Involved_parties__c, Risk_Potential_Description__c, Risk_Potential__c," +
					" JSA_Activity__c, Job_Safety_Analysis__c, Observer_Involved_Resource__c," +
					" Work_stopped_due_incident__c, observer_involved_person__c, Installation__c, Activity_name__c FROM " + SFDC_INCIDENT,
					WHERE:" WHERE ( :PRIds )",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					REPLACE_COLUMN :"JSA_Activity__c",
					RELATED_SQL:"",
					TABLE: SFDC_INCIDENT,
					SOUP_TABLE: SOUP_INCIDENT_TABLE
				},

	"SQLITE_CONTENT_DOCUMENT_LINK_SWR_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_SWR_TABLE+":Id}"+
						" FROM {"+SOUP_SWR_TABLE+"}", 
					WHERE:" LIMIT :OFFSET,:LIMIT",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_CONTENT_DOCUMENT_LINK",
					REPLACE_COLUMN :"LinkedEntityId",
					TABLE: SFDC_SWR,
					SOUP_TABLE: SOUP_SWR_CONTENT_DOC_LINK //soup table defines where content document link records are stored
				},

	"SOQL_CONTENT_DOCUMENT_LINK" : {
					SQL:" Select Id, ContentDocumentId, LinkedEntityId"+
					    " FROM " + SFDC_CONTENT_DOCUMENT_LINK ,
					WHERE:" WHERE ( :PRIds )",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_CONTENT_VERSION",
					REPLACE_COLUMN :"LinkedEntityId",
					TABLE: SFDC_CONTENT_DOCUMENT_LINK,
					SOUP_TABLE: SOUP_SWR_CONTENT_DOC_LINK
				},

	"SOQL_CONTENT_VERSION" : {
					SQL:" Select Id, Title, ContentDocumentId, FileExtension, LastModifiedDate"+
					    " FROM " + SFDC_CONTENT_VERSION ,
					WHERE:" WHERE FSM_isSWR__c = true AND isLatest = true AND (:PRIds)",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"ContentDocumentId",
					TABLE: SFDC_CONTENT_VERSION,
					SOUP_TABLE: SOUP_SWR_CONTENT_VERSION
				},

	"SQLITE_CONTENT_VERSION_CONTDOCLINK_IDS_BATCH":{
					SQL:" SELECT {"+SOUP_SWR_CONTENT_DOC_LINK+":ContentDocumentId}"+
						" FROM {"+SOUP_SWR_CONTENT_DOC_LINK+"}", 
					WHERE:" LIMIT :OFFSET,:LIMIT",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_CONTENT_VERSION",
					REPLACE_COLUMN :"ContentDocumentId",
					TABLE: SFDC_CONTENT_DOCUMENT_LINK,
					SOUP_TABLE: SOUP_SWR_CONTENT_VERSION
				},

	"SOQL_WORK_ORDER_COUNT" : {
					SQL:" SELECT count(Id) RecCount FROM "+SFDC_WORK_ORDER,
					WHERE:" WHERE Id IN ( subquery ) AND (isDeleted=false) AND (CKSW__Status__c !='Completed') AND (CKSW__Status__c !='Cancel') ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					SUBQUERY: " SELECT "+SFDC_WORK_ORDER+" FROM "+SFDC_OPERATIONS+" WHERE (CKSW__Assigned_Resource__c IN ( :ResIds ) ) AND (isDeleted=false) AND (CKSW__IsReadyForSchedule__c=true) ",
					INITQUERY: " SELECT Id FROM "+SFDC_RESOURCE+" WHERE (CKSW__User__c =':PRuserId') AND (isDeleted=false) ",
					TABLE: SFDC_WORK_ORDER,
					SOUP_TABLE:""
				},

	"SOQL_USERS_COUNT" : {
					SQL:"SELECT count(Id) RecCount FROM "+SFDC_USER,
					WHERE:" WHERE (Id != ':PRuserId') AND (isActive=true) AND ((Profile.Name='"+PROFILE_FSMOBILITE+"') OR "+
						  " (Profile.Name='"+PROFILE_FSMOBILITE_NO+"') OR (Profile.Name='"+PROFILE_SYSTEM_ADMIN+"') )", //AND (Id!= ':PRuserId') PROFILE_FSMOBILITE
					ORDERBY:" ORDER BY CreatedDate Desc	",
					LIMIT:1,
					DISPLAY_COLUMN:"", 
					RELATED_SQL:"",
					TABLE: SFDC_USER,
					SOUP_TABLE: SOUP_USER_TABLE
				},

	"SQLITE_WORK_ORDER_FEED_PUSH":{
					SQL:" SELECT {"+SOUP_WORK_ORDER_FEED+":_soup} FROM {"+SOUP_WORK_ORDER_FEED+"}",
					WHERE:" WHERE {"+SOUP_WORK_ORDER_FEED+":SaveStatus} = 'isLocal' ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_FEED_ITEM,
					SOUP_TABLE: SOUP_WORK_ORDER_FEED
				},

	"SQLITE_FEED_COMMENTS_PUSH":{
					SQL:" SELECT {"+SOUP_FEEDCOMMNETS+":_soup} FROM {"+SOUP_FEEDCOMMNETS+"}",
					WHERE:" WHERE {"+SOUP_FEEDCOMMNETS+":SaveStatus} = 'isLocal' ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_FEEDCOMMNETS,
					SOUP_TABLE: SOUP_FEEDCOMMNETS
				},

	//updated by MC 12.10.2015 - gets all isLocal operations and relevant FSE Notes if those are also is local 
	// this works because every time fse notes are changed, operations are labeled "isLocal"
	"SQLITE_OPERATIONS_AND_FSE_NOTES_PUSH":{
					SQL:" SELECT o.{"+SOUP_OPERATION_TABLE+":_soup},"+
						" COALESCE(n.{"+SOUP_FSE_NOTES+":_soup},'') as FSE_Notes"+
						" FROM {"+SOUP_OPERATION_TABLE+"} as o "+
						" LEFT JOIN {"+SOUP_FSE_NOTES+"} as n ON n.{"+SOUP_FSE_NOTES+":Operation__c} = o.{"+SOUP_OPERATION_TABLE+":Id} ",
					WHERE:" WHERE n.{"+SOUP_FSE_NOTES+":SyncStatus} = 'isLocal' OR o.{"+SOUP_OPERATION_TABLE+":SaveStatus} = 'isLocal' ",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_OPERATIONS,
					SOUP_TABLE: SOUP_OPERATION_TABLE,
					SYNC_TABLE: SFDC_SYNC_TABLE
				},

	"SQLITE_TIME_REPORT_TIME_ENTRY_WORK_HOURS_PUSH":{
					SQL:  " SELECT tr.{"+SOUP_TIME_REPORT+":_soup}"+
						  " FROM {"+SOUP_TIME_REPORT+"} as tr " + " WHERE tr.{"+SOUP_TIME_REPORT+":SaveStatus} = 'isLocal' " +
						  " UNION "+
						  " SELECT te.{"+SOUP_TIME_ENTRY+":_soup}"+
						  " FROM {"+SOUP_TIME_ENTRY+"} as te " + " WHERE te.{"+SOUP_TIME_ENTRY+":SaveStatus} = 'isLocal' " +
						  " UNION "+
						  " SELECT wo.{"+SOUP_WORK_HOURS+":_soup}"+
						  " FROM {"+SOUP_WORK_HOURS+"} as wo " + " WHERE wo.{"+SOUP_WORK_HOURS+":SaveStatus} = 'isLocal' ",
					WHERE:"",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_TIME_REPORT,
					SOUP_TABLE: SOUP_TIME_REPORT,
					SYNC_TABLE:  SFDC_SYNC_TABLE
				},

	"SQLITE_APPROVALS_PUSH":{
					SQL:" SELECT so.{"+SOUP_APPROVALS+":_soup} FROM {"+SOUP_APPROVALS+"} so ",
					WHERE:"",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_APPROVALS,
					SOUP_TABLE: SOUP_APPROVALS,
					SYNC_TABLE: SFDC_SYNC_TABLE
				},

	"SQLITE_INCIDENTS_PUSH":{
					SQL:" SELECT {"+SOUP_INCIDENT_TABLE+":_soup} FROM {"+SOUP_INCIDENT_TABLE+"}",
					WHERE:" WHERE {"+SOUP_INCIDENT_TABLE+":SaveStatus} = 'isLocal' ",
					ORDERBY:"",
					LIMIT:200,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_INCIDENT,
					SOUP_TABLE: SOUP_INCIDENT_TABLE,
					SYNC_TABLE: SFDC_INCIDENT
				},

	"SQLITE_JSA_UPDATE":{
					SQL:" SELECT {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+":_soup} FROM {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+"}",
					WHERE:" WHERE {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+":SaveStatus} = 'Updated' ",
					ORDERBY:"",
					LIMIT:200,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS,
					SYNC_TABLE: SFDC_JOB_SAFETY_ANALYSIS,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_TABLE
				},

	"SQLITE_JSA_ACTIVITY_UPDATE":{
					SQL:" SELECT {" + SOUP_JSA_ACTIVITIES_TABLE + ":_soup} FROM {"+SOUP_JSA_ACTIVITIES_TABLE+"}",
					WHERE:" WHERE {"+SOUP_JSA_ACTIVITIES_TABLE+":SaveStatus} = 'Updated' ",
					ORDERBY:"",
					LIMIT:200,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_JSA_ACTIVITIES,
					SYNC_TABLE: SFDC_SYNC_TABLE,
					SOUP_TABLE: SOUP_JSA_ACTIVITIES_TABLE
				},

	"SQLITE_JSA_FEED_PUSH":{
					SQL:" SELECT {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":_soup} FROM {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+"}",
					WHERE:" WHERE {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":SaveStatus} = 'isLocal' ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_JOB_SAFETY_ANALYSIS_FEED,
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_FEED
				},

	"SQLITE_INCIDENTS" : {
					SQL:"SELECT {"+SOUP_INCIDENT_TABLE + ":_soup} FROM {" + SOUP_INCIDENT_TABLE + "}", 
					WHERE:" WHERE {" + SOUP_INCIDENT_TABLE + ":Installation__c} = ':InstallationId'",
					ORDERBY:" ORDER BY {" + SOUP_INCIDENT_TABLE + ":CreatedDate} DESC",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_INCIDENT_TABLE
				},

	"SQLITE_JSA_ACTIVITIES" : {
					SQL:" SELECT {"+SOUP_JSA_ACTIVITIES_TABLE+":_soup} FROM {"+SOUP_JSA_ACTIVITIES_TABLE+"}",
					WHERE:" WHERE {"+SOUP_JSA_ACTIVITIES_TABLE+":Job_Safety_Analysis__r.Service_Order__c} =':ServiceOrderId'",
					ORDERBY:" ORDER BY {" + SOUP_JSA_ACTIVITIES_TABLE + ":RA_Activity__r.Display_Order__c} ASC",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_JSA_ACTIVITIES",
					TABLE: "",
					SOUP_TABLE: SOUP_JSA_ACTIVITIES_TABLE
				},

	"SQLITE_JOB_SAFETY_ANALYSIS" : {
					SQL:" SELECT {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+":_soup} FROM {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+"}",
					WHERE:" WHERE {"+SOUP_JOB_SAFETY_ANALYSIS_TABLE+":Service_Order__c} =':ServiceOrderId'",
					ORDERBY:"",
					LIMIT:2000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"SOQL_JOB_SAFETY_ANALYSIS",
					TABLE: "",
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_TABLE
				},

	"SQLITE_FEED_BODY" : {
					SQL:" SELECT {"+SOUP_WORK_ORDER_FEED+":_soup} FROM {"+SOUP_WORK_ORDER_FEED+"}",
					WHERE:" WHERE {"+SOUP_WORK_ORDER_FEED+":isDownloaded}='No' "+
						  " AND {"+SOUP_WORK_ORDER_FEED+":ContentSize}>0 ",
					ORDERBY:"",
					LIMIT:1,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: SFDC_FEED_ITEM,
					SOUP_TABLE: SOUP_WORK_ORDER_FEED 
				},

	//maria
	"SQLITE_TKIC2":{
					SQL:" SELECT {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":_soup} FROM {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+"}",
					WHERE: 	" WHERE {" + SOUP_TI_ARTICLE_ASSIGNMENT_TABLE + ":Binder__c}=':FileType'" +//Document_Type__c // replaced with Binder__c
							" AND {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Equipment__c}=':EquipmentParam' ",
					ORDERBY:" ORDER BY {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":_soupLastModifiedDate} DESC ",// LastModifiedDate DESC // newest first
					LIMIT: 2000,
					SOUP_TABLE: SOUP_TI_ARTICLE_ASSIGNMENT_TABLE,
				},

	"SQLITE_TKIC":{
					SQL:" SELECT kav.{"+SOUP_TI_ARTICLE_KAV+":_soup},"+ 
						" COALESCE(ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Equipment__c},'') as eq "+
						" FROM {"+SOUP_TI_ARTICLE_KAV+"} as kav"+
						" LEFT JOIN {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+"} as ti ON ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Article_Version_Id__c} = kav.{"+SOUP_TI_ARTICLE_KAV+":Article_Version_Id__c} ",				
					WHERE: 	" WHERE kav.{" + SOUP_TI_ARTICLE_KAV + ":Main_Type__c}=':FileType'" +//Document_Type__c // replaced with Binder__c
							" AND ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Equipment__c}=':EquipmentParam' ",
					ORDERBY:"",
					//ORDERBY:" ORDER BY, kav.{"+SOUP_TI_ARTICLE_KAV+":SubType__c}, kav.{"+SOUP_TI_ARTICLE_KAV+":Date__c} DESC ", // kav.{"+SOUP_TI_ARTICLE_KAV+":_soupLastModifiedDate} DESC ",// LastModifiedDate DESC // newest first
					LIMIT: 2000,
					SOUP_TABLE: SOUP_TI_ARTICLE_KAV,
				},

	"SQLITE_SWR" : {
					SQL:" SELECT st.{"+SOUP_SWR_TABLE+":_soup} FROM {"+SOUP_SWR_TABLE+"} as st",
					WHERE:" WHERE st.{"+SOUP_SWR_TABLE+":Installation__c} =':RecordId'",
					ORDERBY:" ORDER BY st.{"+SOUP_SWR_TABLE+":Approved_Date__c} DESC ", 
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "" ,
					SOUP_TABLE: SOUP_SWR_TABLE
				},

	"SQLITE_OPERATIONS_DETAIL" : {
					SQL:" SELECT o.{"+SOUP_OPERATION_TABLE+":_soup},  "+
						" COALESCE(n.{"+SOUP_FSE_NOTES+":_soup},'') as FSE_Notes , "+
						" COALESCE(c.{"+SOUP_FS_COORDINATOR_NOTES+":_soup},'') as FS_Coordinator_Notes "+
						" FROM {"+SOUP_OPERATION_TABLE+"} as o "+
						" LEFT JOIN {"+SOUP_FSE_NOTES+"} as n ON n.{"+SOUP_FSE_NOTES+":Operation__c} = o.{"+SOUP_OPERATION_TABLE+":Id} "+
						" LEFT JOIN {"+SOUP_FS_COORDINATOR_NOTES+"} as c ON c.{"+SOUP_FS_COORDINATOR_NOTES+":Operation__c} = o.{"+SOUP_OPERATION_TABLE+":Id} ",
					WHERE:" WHERE o.{"+SOUP_OPERATION_TABLE+":Id} =':RecordId' ",
					ORDERBY:" ORDER BY {"+SOUP_OPERATION_TABLE+":WRTS_Operation_Line_number__c} ",
					LIMIT:20,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_OPERATION_TABLE
				},

	"SQLITE_OPERATIONS" : {
					SQL:" SELECT {"+SOUP_OPERATION_TABLE+":_soup} FROM {"+SOUP_OPERATION_TABLE+"}",
					WHERE:" WHERE {"+SOUP_OPERATION_TABLE+":CKSW__WorkOrder__c} =':RecordId'",
					ORDERBY:" ORDER BY {"+SOUP_OPERATION_TABLE+":WRTS_Operation_Line_number__c} ",
					LIMIT:20,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_OPERATION_TABLE
				},

	"SQLITE_WO_CHATT" : {
					SQL:" SELECT wo_f.{"+SOUP_WORK_ORDER_FEED+":_soup}, COALESCE(u1.{"+SOUP_USER_TABLE+":Name},'') as UserName,"+
						" COALESCE(fc.{"+SOUP_FEEDCOMMNETS+":_soup},'') as Comments,"+
						" COALESCE(u2.{"+SOUP_USER_TABLE+":Name},'') as CommentUserName"+
						" FROM {"+SOUP_WORK_ORDER_FEED+"}  as wo_f"+
						" LEFT JOIN {"+SOUP_USER_TABLE+"} as u1 ON u1.{"+SOUP_USER_TABLE+":Id} = wo_f.{"+SOUP_WORK_ORDER_FEED+":InsertedById}"+
						" LEFT JOIN {"+SOUP_FEEDCOMMNETS+"} as fc ON fc.{"+SOUP_FEEDCOMMNETS+":FeedItemId} = wo_f.{"+SOUP_WORK_ORDER_FEED+":Id}"+
						" LEFT JOIN {"+SOUP_USER_TABLE+"} as u2 ON u2.{"+SOUP_USER_TABLE+":Id} = fc.{"+SOUP_FEEDCOMMNETS+":CreatedById} ",
					WHERE:" WHERE wo_f.{"+SOUP_WORK_ORDER_FEED+":ParentId} =':RecordId' ",
					ORDERBY:" ORDER BY wo_f.{"+SOUP_WORK_ORDER_FEED+":CreatedDate} DESC ",
					LIMIT:50,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_WORK_ORDER_FEED 
				},

	"SQLITE_JSA_CHATTER" : {
					SQL:" SELECT jsa_f.{"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":_soup},"+
						" COALESCE(u1.{"+SOUP_USER_TABLE+":Name},'') as UserName,"+
						" COALESCE(fc.{"+SOUP_FEEDCOMMNETS+":_soup},'') as Comments,"+
						" COALESCE(u2.{"+SOUP_USER_TABLE+":Name},'') as CommentUserName"+
						" FROM {"+SOUP_JOB_SAFETY_ANALYSIS_FEED+"}  as jsa_f"+
						" LEFT JOIN {"+SOUP_USER_TABLE+"} as u1 ON u1.{"+SOUP_USER_TABLE+":Id} = jsa_f.{"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":InsertedById}"+
						" LEFT JOIN {"+SOUP_FEEDCOMMNETS+"} as fc ON fc.{"+SOUP_FEEDCOMMNETS+":FeedItemId} = jsa_f.{"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":Id}"+
						" LEFT JOIN {"+SOUP_USER_TABLE+"} as u2 ON u2.{"+SOUP_USER_TABLE+":Id} = fc.{"+SOUP_FEEDCOMMNETS+":CreatedById} ",
					WHERE:" WHERE jsa_f.{"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":ParentId} =':RecordId' ",
					ORDERBY:" ORDER BY jsa_f.{"+SOUP_JOB_SAFETY_ANALYSIS_FEED+":CreatedDate} DESC ",
					LIMIT:50,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_JOB_SAFETY_ANALYSIS_FEED 
				},

	"SQLITE_WORK_ORDER_DETAIL":	{
					SQL: " SELECT {"+SOUP_WORK_ORDER+":_soup},"+
						 " COALESCE({"+SOUP_INSTALLATIONS_TABLE+":Name},'') as Installation,"+
						 " COALESCE({"+SOUP_EQUIPMENT_TABLE+":Equipment_Text__c},'') as Equipment,"+
						 " COALESCE({"+SOUP_WORK_ORDER+":WRTS_Coordinator_Name__c},'') as WRTS_Coordinator_Name__c ,"+
						 " COALESCE({"+SOUP_WORK_ORDER+":WRTS_SAP_Order_ID__c},'') as WRTS_SAP_Order_ID__c"+
						 " FROM {"+SOUP_WORK_ORDER+"}"+
						 " LEFT JOIN {"+SOUP_EQUIPMENT_TABLE+"} ON {"+SOUP_WORK_ORDER+":WRTS_Equipment_ID__c} = {"+SOUP_EQUIPMENT_TABLE+":Id} "+
						 " LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} ON {"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} = {"+SOUP_INSTALLATIONS_TABLE+":Id} ",
					WHERE:" WHERE {"+SOUP_WORK_ORDER+":Id} =':RecordId'",
					ORDERBY:" ORDER BY {"+SOUP_WORK_ORDER+":CKSW__End_Date_Date__c}",
					LIMIT:50,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE:SOUP_WORK_ORDER
				},

	"SQLITE_WORK_ORDER" : {
					SQL: " SELECT {"+SOUP_WORK_ORDER+":_soup},"+
						 " COALESCE({"+SOUP_INSTALLATIONS_TABLE+":Name},'') as Instalation"+
						 " FROM {"+SOUP_WORK_ORDER+"}"+
						 " LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} ON {"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} = {"+SOUP_INSTALLATIONS_TABLE+":Id} ",
					WHERE:"",
					ORDERBY:" ORDER BY {"+SOUP_WORK_ORDER+":CKSW__Start_Date_Date__c} DESC ",
					LIMIT:20,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE:SOUP_WORK_ORDER
				},

	"SQLITE_SPARE_PARTS_DETAILS":{
					SQL:" SELECT so.{"+SOUP_SALES_ORDER+":_soup}, COALESCE(sp.{"+SOUP_SPARE_PARTS+":_soup},'') as LineItem"+
						" FROM {"+SOUP_SALES_ORDER+"} as so, {"+SOUP_WORK_ORDER+"} as wo" +
						" LEFT JOIN {"+SOUP_SPARE_PARTS+"} as sp ON sp.{"+SOUP_SPARE_PARTS+":Sales_Order__c} = so.{"+SOUP_SALES_ORDER+":Id} "+
						" LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} as i ON i.{"+SOUP_INSTALLATIONS_TABLE+":Id} = wo.{"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} ",						
					WHERE:" WHERE wo.{"+SOUP_WORK_ORDER+":Id} =':RecordId' AND so.{"+SOUP_SALES_ORDER+":Installation__c} = i.{"+SOUP_INSTALLATIONS_TABLE+":Id}",
					ORDERBY:" ORDER BY so.{"+SOUP_SALES_ORDER+":CreatedDate} DESC ",
					LIMIT:100,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_SALES_ORDER
				},

	"SQLITE_WORK_HOURS_DETAIL" :{
					SQL:" SELECT wh.{"+SOUP_WORK_HOURS+":_soup},  '"+TYPE_WORKHOURS+"'  as Type, wh.{"+SOUP_WORK_HOURS+":Type__c} "+
						" FROM  {"+SOUP_WORK_HOURS+"}  as wh GROUP BY 3 "+
						"  UNION "+
						" SELECT rs.{"+SOUP_RESOURCE+":_soup}, '"+TYPE_RESOURCE+"' as Type, rs.{"+SOUP_RESOURCE+":Name} "+
						" FROM  {"+SOUP_RESOURCE+"} as rs GROUP BY 3 ",
					WHERE:"",
					ORDERBY:" ORDER BY 3" ,
					LIMIT:20,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_WORK_HOURS
				},

	"SQLITE_RESOURCE" : {
					SQL:" SELECT {"+SOUP_RESOURCE+":_soup}"+
						" FROM {"+SOUP_RESOURCE+"}",
					WHERE:"",
					ORDERBY:"",
					LIMIT:500,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					REPLACE_COLUMN :"",
					TABLE: SFDC_RESOURCE,
					SOUP_TABLE: SOUP_RESOURCE
				},

	"SQLITE_TIME_REPORT_DETAIL":{
					SQL: " SELECT tr.{"+SOUP_TIME_REPORT+":_soup}, COALESCE(wh.{"+SOUP_WORK_HOURS+":Type__c}, '') as WHType, "+
						 " SUM(COALESCE(wh.{"+SOUP_WORK_HOURS+":Reported_Hours__c}, 0)) as ReportedHrs, "+
						 " COALESCE(rs.{"+SOUP_RESOURCE+":Name},'') as Resource_Name,"+
						 " COALESCE(wh.{"+SOUP_WORK_HOURS+":Id},'') as WorkHours_Id, "+
						 " COALESCE(wh.{"+SOUP_WORK_HOURS+":Name},'') as WorkHours_Name ,"+
						 " COALESCE(rs.{"+SOUP_RESOURCE+":Id},'') as Resource_Id, "+ 
						 " COALESCE(wh.{"+SOUP_WORK_HOURS+":Approved__c},'') as WorkHours_Approved "+
						 " FROM {"+SOUP_TIME_REPORT+"} as tr "+ //wh Id - 4th index; wh Name - 5th index; resourceId - 6th index; wh approved - 7th index
						 " LEFT JOIN {"+SOUP_TIME_ENTRY+"} as te ON te.{"+SOUP_TIME_ENTRY+":Time_Report__c} = tr.{"+SOUP_TIME_REPORT+":Id} "+
						 " LEFT JOIN {"+SOUP_WORK_HOURS+"} as wh ON wh.{"+SOUP_WORK_HOURS+":Time_Entry__c} = te.{"+SOUP_TIME_ENTRY+":Id} "+
						 " LEFT JOIN {"+SOUP_RESOURCE+"} as rs ON rs.{"+SOUP_RESOURCE+":Id} = te.{"+SOUP_TIME_ENTRY+":Resource__c} ",
					WHERE:" WHERE tr.{"+SOUP_TIME_REPORT+":Service_Order__c} =':RecordId' "+
						  " GROUP BY tr.{"+SOUP_TIME_REPORT+":Report_Date__c}, rs.{"+SOUP_RESOURCE+":Id}, COALESCE(wh.{"+SOUP_WORK_HOURS+":Type__c}, '') ",
					ORDERBY:" ORDER BY tr.{"+SOUP_TIME_REPORT+":Report_Date__c} DESC " , //ORDER BY so.{"+SOUP_SALES_ORDER+":CreatedDate} DESC
					LIMIT:1000,
					DISPLAY_COLUMN:"",
					RELATED_SQL:"",
					TABLE: "",
					SOUP_TABLE: SOUP_TIME_REPORT
				},

	"SQLITE_INSTALLATIONS_RESOURCES":{
					SQL:" SELECT COALESCE(ins1.{"+SOUP_INSTALLATIONS_TABLE+":Id},'') as installations,"+
						" so1.{"+SOUP_WORK_ORDER+":Id} as serviceorderId,"+
						" so1.{"+SOUP_WORK_ORDER+":WRTS_SAP_Order_ID__c} as serviceorderSap,"+
						" so1.{"+SOUP_WORK_ORDER+":WRTS_Notification_Description__c} as serviceorderTitle,"+
						" COALESCE(rs1.{"+SOUP_RESOURCE+":Id},'') as resourceId,"+
						" COALESCE(rs1.{"+SOUP_RESOURCE+":Name},'') as resourceName,"+
						" COALESCE(ins1.{"+SOUP_INSTALLATIONS_TABLE+":Name},'') as installationName,"+
						" COALESCE(tar.{"+SOUP_ASSIGNED_RESOURCE+":Id},'') as tarId"+
						" FROM {"+SOUP_WORK_ORDER+":} as so1"+
						" LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} as ins1 on so1.{"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} = ins1.{"+SOUP_INSTALLATIONS_TABLE+":Id}"+						
						" LEFT JOIN {"+SOUP_OPERATION_TABLE+"} as op1 on op1.{"+SOUP_OPERATION_TABLE+":CKSW__WorkOrder__c} = so1.{"+SOUP_WORK_ORDER+":Id}"+
						" LEFT JOIN {"+SOUP_ASSIGNED_RESOURCE+"} as tar on tar.{"+SOUP_ASSIGNED_RESOURCE+":Task__c} = op1.{"+SOUP_OPERATION_TABLE+":Id}"+
						" LEFT JOIN {"+SOUP_RESOURCE+"} as rs1 on rs1.{"+SOUP_RESOURCE+":Id} = tar.{"+SOUP_ASSIGNED_RESOURCE+":Resource__c}",
					WHERE:" WHERE so1.{"+SOUP_WORK_ORDER+":Id} =':RecordId' ",
					ORDERBY:"",
					LIMIT:2000,
					SOUP_TABLE: SOUP_INSTALLATIONS_TABLE
				},
	
	"SQLITE_TIME_REGISTRATIONS":{
					SQL:" SELECT tr.{"+SOUP_TIME_REPORT+":_soup} as TimeReports, "+
						" COALESCE(te.{"+SOUP_TIME_ENTRY+":_soup},'') as TimeEntries, "+
						" COALESCE(wh.{"+SOUP_WORK_HOURS+":_soup},'') as WorkHours "+
						" FROM {"+SOUP_TIME_REPORT+"} as tr "+
						" LEFT JOIN {"+SOUP_TIME_ENTRY+"} as te ON te.{"+SOUP_TIME_ENTRY+":Time_Report__c} = tr.{"+SOUP_TIME_REPORT+":Id} "+
						" LEFT JOIN {"+SOUP_WORK_HOURS+"} as wh ON wh.{"+SOUP_WORK_HOURS+":Time_Entry__c} = te.{"+SOUP_TIME_ENTRY+":Id} ",
					WHERE:" WHERE wh.{"+SOUP_WORK_HOURS+":Approved__c}='false' AND wh.{"+SOUP_WORK_HOURS+":Reported_Hours__c}<>'0.00' AND  tr.{"+SOUP_TIME_REPORT+":Service_Order__c} IN (:ParentIds) ",
					ORDERBY:" ORDER BY tr.{"+SOUP_TIME_REPORT+":Report_Date__c} DESC ",
					LIMIT:2000
				},

	"SQLITE_CUSTOMER_APPROVAL":{
					SQL:" SELECT so.{"+SOUP_WORK_ORDER+":Id}, so.{"+SOUP_WORK_ORDER+":WRTS_Notification_Description__c}, "+
						" so.{"+SOUP_WORK_ORDER+":_soup} "+
						" FROM {"+SOUP_WORK_ORDER+"} so ",
					WHERE:" WHERE so.{"+SOUP_WORK_ORDER+":Id} IN ( :idList ) ",
					ORDERBY:"",
					LIMIT:2000
				},

	"SQLITE_SITEMAP":{
					SQL:" SELECT so.{"+SOUP_WORK_ORDER+":Id},"+
						" COALESCE(ins.{"+SOUP_INSTALLATIONS_TABLE+":_soup},'') as Installation,"+
						" COALESCE(eq.{"+SOUP_EQUIPMENT_TABLE+":_soup},'') as Equipment,"+
						" so.{"+SOUP_WORK_ORDER+":WRTS_Cordinator_name__c}"+
						" FROM {"+SOUP_WORK_ORDER+"} so "+
						" LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} as ins on so.{"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} = ins.{"+SOUP_INSTALLATIONS_TABLE+":Id}"+
						" LEFT JOIN {"+SOUP_EQUIPMENT_TABLE+"} as eq on ins.{"+SOUP_INSTALLATIONS_TABLE+":Id} = eq.{"+SOUP_EQUIPMENT_TABLE+":Installation__c}",
					WHERE:" WHERE so.{"+SOUP_WORK_ORDER+":Id} =':RecordId' ",
					ORDERBY:"",
					LIMIT:2000
				},

	"SQLITE_TASK_PUSH":{
					SQL:" SELECT t.{"+SOUP_TASK+":_soup} FROM {"+SOUP_TASK+"} t ",
					WHERE:" WHERE t.{"+SOUP_TASK+":SaveStatus}='isLocal' ",
					ORDERBY:"",
					LIMIT:2000,
					TABLE:SFDC_TASK,
					SYNC_TABLE: SFDC_TASK
	},

	"SQLITE_ERRORS_PUSH":{
					SQL:" SELECT e.{"+SOUP_ERROR_LOG+":_soup} FROM {"+SOUP_ERROR_LOG+"} e ",
					WHERE:"",
					ORDERBY:" ORDER BY e.{"+SOUP_ERROR_LOG + ":_soupLastModifiedDate} ASC ",
					LIMIT:2000,
					TABLE:SOUP_ERROR_LOG,
					SYNC_TABLE: SFDC_SYNC_TABLE
	},

	"SQLITE_STOCK_INSTALLATION":{
					SQL:" SELECT so.{"+SOUP_WORK_ORDER+":Id},"+
						" COALESCE(ins.{"+SOUP_INSTALLATIONS_TABLE+":Installation_Cluster__c},'') as Installation"+
						" FROM {"+SOUP_WORK_ORDER+"} so"+
						" LEFT JOIN {"+SOUP_INSTALLATIONS_TABLE+"} as ins on so.{"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} = ins.{"+SOUP_INSTALLATIONS_TABLE+":Id}",
					WHERE:" WHERE so.{"+SOUP_WORK_ORDER+":Id} =':RecordId' ",
					ORDERBY:"",
					LIMIT:1
	}

};

function ReplaceSQLParameters(SQL,Parameters){
	var Result = SQL;
	try{
		var VariableType = Parameters.VariableType;
		var ReplaceValue = Parameters.ReplaceValue;
		var VariableValue = Parameters.VariableValue;
		var reg = new RegExp(ReplaceValue,"gi");
		if((Result!==undefined) &&(Result!==null)){
			switch(VariableType){
				case "String":
					Result = SQL.replace(reg, VariableValue);
					break;
				default:
					break;
			}
		}
		return Result;
	}
	catch(err){
		storeExternalError(err,{"Where":"ReplaceSQLParameters","SQL":SQL,"Parameters":Parameters});
		return SQL;
	}
}
