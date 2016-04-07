/*
  @Author: Juraj Ciljak, Mathias
  @email:juraj.ciljak@accenture.com
  @Version: 1.0
  @LastModified: 13.10.2015;
  @Description:  Object for store Indexes of Smart Store Database
  @WARNING: All field used in where statements must be declare as index
*/
var tableIndex =
{
	"IDX_ERROR_LOG" : [
		{ path : "Description", type : "string" },{ path : "Message", type : "string" },
		{ path : "Number", type : "string" },{ path : "Name", type : "string" },
		{ path : "Stack", type : "string" },{ path : "Variables", type : "string" },
		{ path : "Day", type : "string" }
	],
	"IDX_SYSTEM_TABLE" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" }
	],
	"IDX_USER_TABLE" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" },
		{ path : "Email", type : "string" }, { path : "TimeZoneSidKey", type : "string" }
	],
	"IDX_RESOURCE" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "CreatedById", type:"string" },{ path : "CKSW__User__c", type:"string" },
		{ path : "FS_Mobility_ExternalId__c", type:"string" }
	],
	"IDX_ASSIGNED_RESOURCE" : [
		{ path : "Id", type : "string" },{ path : "Task__c", type : "string" },
		{ path : "Resource__c", type : "string" }
	],
	"IDX_OPERATIONS_TABLE" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" },
		{ path : "CreatedDate", type : "string" }, { path : "CKSW__WorkOrder__c", type : "string" },
		{ path : "WRTS_Operation_Line_number__c", type : "string" },{ path : "LastModifiedDate", type : "string" },
		{ path : "CKSW__Assigned_Resource__c", type : "string" },{ path : "SaveStatus", type : "string" },
		{ path : "CKSW__City__c", type : "string" }, { path : "CKSW__Country__c", type : "string" }
	],
	"IDX_WORK_ORDER" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" }, { path : "WRTS_Equipment_ID__c", type : "string" },
		/*{ path : "CKSW__Contact__c", type : "string" },*/ { path : "CKSW__Account__c", type : "string" },
		{ path : "WRTS_Installation_ID__c", type : "string" }, { path : "CreatedDate", type : "string" },
		{ path : "Contact_Person_At_Site__c", type : "string" }, { path : "CKSW__End_Date_Date__c", type : "string" },
		{ path : "WRTS_Coordinator_Name__c", type : "string" }, { path : "WRTS_SAP_Order_ID__c", type : "string" },
		{ path : "WRTS_Contact_Person_Phone__c", type : "string" }, { path : "WRTS_Notification_Description__c", type : "string" },
		{ path : "CKSW__Description__c", type : "string" }, { path : "CKSW__Start_Date_Date__c", type : "string" },
		{ path : "General_Remarks__c", type : "string" }, { path : "WRTS_Contact_Person_Name__c", type : "string" },
		{ path : "WRTS_Contact_Person_Email__c", type : "string" }, { path : "FSM_SignatureJSON__c", type : "string" },
		{ path : "isApproved", type : "string" }, { path : "FSM_Signature__c", type : "string" },
		{ path : "WRTS_Cordinator_name__c", type : "string" }
	],
	"IDX_WORK_ORDER_FEED_TABLE" : [
		{ path : "Id", type : "string" }, { path : "ParentId", type : "string" },
		{ path : "isDownloaded", type : "string" },{ path : "SaveStatus", type : "string" },
		{ path : "CreatedDate", type : "string" },{ path : "ContentFileName", type : "string" },
		{ path : "ContentSize", type : "string" },{ path : "InsertedById", type : "string" },
		{ path : "pictureUri", type : "string" }
	],
	"IDX_FEEDCOMMENT_TABLE" : [
		{ path : "Id", type : "string" }, { path : "ParentId", type : "string" },
		{ path : "SaveStatus", type : "string" }, { path : "CreatedById", type : "string" },
		{ path : "FeedItemId", type : "string" }, { path : "isDownloaded", type : "string" }
	],
	"IDX_INSTALLATION_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "CreatedDate", type : "string" }, { path : "Installation_Cluster__c", type : "string" }
	],
	"IDX_EQUIPMENT_TABLE" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" },
		{ path : "CreatedDate", type : "string" },{ path : "Equipment_Text__c", type : "string" },
		{ path : "Installation__c", type : "string" },{ path : "Equipment_Category__c", type : "string" }
	],
	"IDX_SALES_ORDER_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Service_Order__c", type : "string" },{ path : "Installation__c", type : "string" }
	],
	"IDX_SPARE_PARTS_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Sales_Order__c", type : "string" }
	],
	"IDX_FSE_NOTES" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Operation__c", type : "string" }, { path : "CreatedById", type : "string" },
		{ path : "SyncStatus", type : "string" }, { path : "LastModifiedDate", type : "string" },
		{ path : "FS_Mobility_ExternalId__c", type : "string" }
	],
	"IDX_FS_COORDINATOR_NOTES" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Operation__c", type : "string" },{ path : "Title__c", type:"string" },
		{ path : "Text__c", type:"string" }
	],
	"IDX_JSA_ACTIVITIES_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Job_Safety_Analysis__c", type : "string" }, 
		{ path : "Job_Safety_Analysis__r.Service_Order__c", type : "string" },
		{ path : "RA_Activity__r.Activity_Title__c", type : "string" }, { path : "JSA_Activity__c.Approved__c", type : "string" },
		{ path : "SaveStatus", type : "string" }, { path : "RA_Activity__r.Display_Order__c", type : "integer" },
		{ path : "Approved__c", type : "string" }
	],
	"IDX_JOB_SAFETY_ANALYSIS_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Service_Order__c", type:"string" }, 
		{ path : "SaveStatus", type:"string" }
	],
	"IDX_INCIDENT_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Job_Safety_Analysis__c", type:"string" },
		{ path : "JSA_Activity__c", type:"string" }, { path : "SaveStatus", type:"string" },
		{ path : "isDownloaded", type : "string" }, { path : "CreatedDate", type : "string" },
		{ path : "Incident_type__c", type : "string" }, { path : "Installation__c", type : "string" }
	],
	"IDX_TI_ARTICLE_ASSIGNMENT_TABLE" : [
		{ path : "Id", type : "string" }, { path : "Name", type:"string" }, 
		{ path : "Title__c", type:"string" }, { path : "Article_Version_Id__c", type:"string" }, 
		{ path : "Installation__c", type:"string" }, { path : "Equipment__c", type:"string" }, 
		{ path : "Document_Type__c", type:"string" },{ path : "Binder__c", type:"string" },
	],
	"IDX_TI_ARTICLE_KAV" : [
		{ path : "Id", type : "string" }, { path : "PDF_File__Name__s", type:"string" }, 
		{ path : "Bulletin_Document__Name__s", type:"string" }, { path : "Article_Version_Id__c", type:"string" }, 
		{ path : "Installation__c", type:"string" }, { path : "HTML_File__Name__s", type:"string" }, 
		{ path : "SubType__c", type:"string" },{ path : "Title", type:"string" },
		{ path : "Main_Type__c", type:"string" },{ path : "Date__c", type:"string" }, 
		{ path : "Extension", type:"string" }
	],
	"IDX_DOC_TABLE" : [
		{ path : "Name", type : "string" }, { path : "Id", type : "string" },
		{ path : "isDownloaded", type : "string" },{ path : "ParentId", type : "string" }
	],
	"IDX_JOB_SAFETY_ANALYSIS_FEED_TABLE" : [
		{ path : "Id", type : "string" }, { path : "ParentId", type : "string" },
		{ path : "isDownloaded", type : "string" },{ path : "SaveStatus", type : "string" },
		{ path : "CreatedDate", type : "string" },{ path : "ContentFileName", type : "string" },
		{ path : "ContentSize", type : "string" },{ path : "InsertedById", type : "string" },
		{ path : "pictureUri", type : "string" }
	], 
	"IDX_BATCH_TEMP_TABLE" : [
		{ path : "Id", type : "string" }, { path : "ParentId", type : "string" },
		{ path : "isDownloaded", type : "string" }, { path : "ObjectType", type : "string" }
	],
	"IDX_BATCH_TEMP_ATTACHEMENT_TABLE" : [
		{ path : "Id", type : "string" }, { path : "ParentId", type : "string" },
		{ path : "isDownloaded", type : "string" }
	],
	"IDX_TIME_REPORT" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Service_Order__c", type : "string" }, { path : "CreatedById", type:"string" },
		{ path : "Report_Date__c", type:"string" }, { path : "SaveStatus", type : "string" },
		{ path : "FS_Mobility_ExternalId__c", type:"string" }
	],
	"IDX_TIME_ENTRY" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Time_Report__c", type : "string" }, { path : "CreatedById", type:"string" }, 
		{ path : "Resource__c", type:"string" },{ path : "FS_Mobility_ExternalId__c", type:"string" },
		{ path : "SaveStatus", type : "string" },{ path : "TimeReport_ExternalId", type : "string" }
	],
	"IDX_WORK_HOURS" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Time_Entry__c", type : "string" }, { path : "CreatedById", type:"string" },
		{ path : "Reported_Hours__c", type : "string" }, { path : "Type__c", type:"string" },
		{ path : "FS_Mobility_ExternalId__c", type:"string" }, { path : "SaveStatus", type : "string" },
		{ path : "Start_Time__c", type : "string" }, { path : "End_Time__c", type : "string" },
		{ path : "Location__c", type : "string" }, { path : "Approved__c", type : "string" },
		{ path : "TimeEntry_ExternalId", type : "string" }, { path : "FSM_ApprovalId__c", type : "string" },
		{ path : "Comments__c", type : "string" }
	],
	"IDX_SWR" : [
		{ path : "Id", type : "string" }, { path : "Name", type : "string" },
		{ path : "Service_Work_Report_Name__c", type : "string" }, { path : "Service_Order_ID__c", type : "string" },
		{ path : "Extension", type : "string" }, { path : "Approved_Date__c", type : "string" },
		{ path : "Installation__c", type : "string" }
	],
	"IDX_SWR_CONT_DOC_LINK" : [/*Maria Ciskova 21.10.2015*/
		{ path : "Id", type : "string" }, { path : "ContentDocumentId", type : "string" },
		{ path : "LinkedEntityId", type : "string" }
	],
	"IDX_SWR_CONT_VERSION" : [/*Maria Ciskova 21.10.2015*/
		{ path : "Id", type : "string" }, { path : "Title", type : "string" },
		{ path : "ContentDocumentId", type : "string" }, { path : "FileExtension", type : "string" },
		{ path : "LastModifiedDate", type : "string" }, { path : "Extension", type : "string" }
	],
	"IDX_TKIC" : [/*Denis Ivancik 27.8. added table for Bulletins, Manuals, SparePartCatalog; SFDC Object: TI_Article_Assignment__c*/
		{ path : "Id", type : "string" }, { path : "Name", type : "string" }, 
		{ path : "Article_Version_Id__c", type : "string" }, { path : "Title__c", type : "string" },
		{ path : "Document_Type__c", type : "string" }, //Document_Type__c = {'ASI', 'MAN', 'SPC'}
		{ path : "Installation__c", type : "string" }, { path : "Equipment__c", type : "string" },
		{ path : "Extension", type : "string" }, {path: "Binder__c", type : "string" }
	],
	"IDX_APPROVAL" : [
		{ path : "Id",type:"string" }, { path : "Service_Order",type:"string" },
		{ path : "Customer_Name",type:"string" }, { path : "Customer_Email",type:"string" },
		{ path : "General_Remarks",type:"string" }, { path : "Signature",type:"string" },
		{ path : "Work_Hour_Ids",type:"string" }, { path : "CreatedDate",type:"string" },
		{ path : "Signature_Name",type:"string" }, { path : "Installation_Name",type:"string" }
	],
	"IDX_TASK" : [
		{ path : "Id", type : "string" }, { path : "WhatId", type : "string" },
		{ path : "Status", type : "string" }, { path : "CreatedById", type:"string" },
		{ path : "ActivityDate", type : "string" }, { path : "Subject", type:"string" },
		{ path : "FS_Mobility_ExternalId__c", type:"string" }, { path : "SaveStatus", type : "string" },
		{ path : "OwnerId", type : "string" }, { path : "WhatId", type : "string" },
		{ path : "Description", type : "string" }, { path : "Priority", type : "string" },
		{ path : "isChangeOrder__c", type : "string" },{ path : "Reason_for_Rejection__c", type : "string" },
		{ path : "pictureUri", type : "string" },{ path : "Sub_Status__c", type : "string" }, 
		{ path : "CreatedDate", type : "string" },{ path : "Service_Order__c", type : "string" },
		{ path : "Installation__c", type : "string" }
	]
};