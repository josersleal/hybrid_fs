//HTML header // Denis Ivancik 11.9.2015 removed unused code
var htmlHeader =
{
	"OPERATION_POPUP_PROGRESS_BAR": 
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>'+
		'<div class="sliderTickmarks "><span></span></div>',
};

//Object for storing count of record in memory
var COUNT_ROW = {
	Value: 0
};
var USER_DATA = {
	Id: "",		Name: "",	Email: "",	TimeZoneSidKey: ""
};
var PROGRESS_BAR = {
	Display: true,	ProgressValue: 0,	Text: "",	errorMessage: ""
};
var BATCH_FEED = {
	Id: "",	ParentId: "",	isDownloaded: "",	ObjectType: ""
};
var BATCH_ATTACHEMENT = {
	Id: "",	ParentId: "",	isDownloaded: ""
};
var INCIDENT = {
	Id: "",	isDownloaded: "",	SaveStatus: "",	Incident_Summary__c: "",	Incident_type__c: "",
	observer_involved_person__c: "",	Involved_parties__c: "",	Risk_Potential_Description__c: "",
	Risk_Potential__c: "",	Observer_Involved_Resource__c: "",	Work_stopped_due_incident__c: "",
	JSA_Activity__c: "",	Job_Safety_Analysis__c: "",
	attributes: {
		type: "",	url: ""
	}
};
var PUSH_INCIDENT = {
	Incident_Summary__c: "",	Incident_type__c: "",	observer_involved_person__c: "",
	Involved_parties__c: "",	Risk_Potential__c: "",	Work_stopped_due_incident__c: "",
	JSA_Activity__c: ""
};
var PUSH_JSA_ACTIVITY = {
	Approved__c: "",	Id: ""
};
var PUSH_JSA = {
	Asbestos_Free_Certificate_Declaration__c: "",	Dangerous_Goods_Storage__c: "",
	Ventilation_Conditions__c: "",	Waste_management__c: "",	Scaffolding_Certificate__c: "",
	Other_Hazardous_Materials__c: "",	Firefighting_quipment__c: "",	Emergency_Routes_and_Exits__c: "",
	General_Housekeeping_Work_Environment__c: "",	lifting_hoisting_equipment__c: "",
	State_of_Electrical_Systems__c: "",	State_of_Hydraulic_Equipments__c: "",	Engine_specific_tools__c: ""
};
var FEED_ITEM = {
	Id: "",	ParentId: "",	Title: "",	isDownloaded: "",	SaveStatus: "",	Body: "",	Visibility: "",
	Type: "",	LinkUrl: "",	LikeCount: "",	CreatedDate: "",	ContentType: "",	ContentSize: 0,
	ContentFileName: "",	ContentDescription: "",	CommentCount: "",	FeedComments:{},
	attributes: {
		type: "",	url: ""
	}
};
var COMMENT_ITEM = {
	Id: "",	ParentId: "",	FeedItemId: "",	CreatedDate: "",	isDownloaded: "",
	SaveStatus: "",	CommentBody: "",	RelatedRecordId: "",
	attributes: {
		type: "",	url: ""
	}
};
var FEED_LINE = {
	Id: "",	ParentId: "",	Title: "",	isDownloaded: "",	Body: "",	CreatedDate: "",	
	ContentSize: 0,	ContentFileName: "",	UserName: "",	FeedComments: {}
};
var FEED_COMMENT = {
	Id: "",	FeedItemId: "",	ParentId: "",	CreatedDate: "",	CommentBody: "",	IsDeleted: "",	
	CommentType: "",	RelatedRecordId: "",	SaveStatus: "",	UserName: ""
};
var OPPERATION_LINE = {
	Id: "",	Name: "",	WRTS_Operation_description__c: "",	WRTS_Operation_Progress__c: 0,
	WRTS_Total_Duration__c: "",	CKSW__Notes__c: "",	WRTS_Total_Duration_unit__c: "",
	WRTS_Operation_Line_number__c: "",	LastModifiedDate: "",	CKSW__Early_Start_Date__c: "",
	CKSW__Due_Date_Date__c: "",	FSE_Notes: {},	FS_Coordinator_Notes: {}
};
var PUSH_OPPERATION = {
	Id: "",	Name: "",	WRTS_Operation_Progress__c: 0,	LastModifiedDate: "",	FSE_Notes: {}
};
var PUSH_FSE_NOTES = {
	Id: "",	Notes__c: "",	Operation__c: "",	LastModifiedDate: "",	FS_Mobility_ExternalId__c: ""
};
var PUSH_TIME_REPORT = {
	Id: "",	Service_Order__c: "",	Report_Date__c: "",	LastModifiedDate: "",	FS_Mobility_ExternalId__c: ""
};
var PUSH_TIME_ENTRY = {
	Id: "",	Time_Report__c: "",	Resource__c: "",	LastModifiedDate: "",	FS_Mobility_ExternalId__c: "",	TimeReport_ExternalId: ""
};
var PUSH_WORK_HOUR = {
	Id: "",	Time_Entry__c: "",	Reported_Hours__c: "",	Type__c: "",	LastModifiedDate: "",
	FS_Mobility_ExternalId__c: "",	Approved__c: "",	TimeEntry_ExternalId: "", Comments__c: ""
};
var FSE_NOTES_DB = {
	Id: "",	Name: "",	Notes__c: "",	LastModifiedDate: "",	CreatedDate: "",
	Operation__c: "",	CreatedById: "",	SyncStatus: "",
	attributes: {
		type: "",	url: ""
	}
};
var FSE_NOTES = {
	Id: "",	Name: "",	Notes__c: "",	CreatedDate: "",	Operation__c: "",	CreatedById: ""
};

var FS_COORDINATOR_NOTES = {
	Id: "",	Name: "",	Operation__c: "",	Title__c: "",	Text__c: ""
};
var WH_LINE = {
	Id: "",	Report_Date__c: "",	CKSW__Engineer_Equipment__c: {}
};
var RES_NAME = {
	Name: "",	Work_Hours__c: {}
};
var WH_HOURS = {
	Type__c: "",	Reported_Hours__c: 0
};
var WORK_HOUR = {
	Id: "",	Name: "",	SaveStatus: "",	LastModifiedDate: "",	Time_Entry__c: "",	Reported_Hours__c: 0,
	Type__c: "",	Start_Time__c: "",	End_Time__c: "",	Location__c: "",	Approved__c: "false",
	FS_Mobility_ExternalId__c: "",	TimeEntry_ExternalId: "", Comments__c: "",
	attributes: {
		type: "",	url: ""
	}
};
var TIME_ENTRY = {
	Id: "",	Name: "",	Time_Report__c: "",	Resource__c: "",	SaveStatus: "",
	LastModifiedDate: "",	FS_Mobility_ExternalId__c: "",	TimeReport_ExternalId: "",
	attributes: {
		type: "",	url: ""
	}
};
var TIME_REPORT = {
	Id: "",	Name: "",	SaveStatus: "",	LastModifiedDate: "",	CKSW__User__c: "",
	Report_Date__c: "",	FS_Mobility_ExternalId__c: "",	Service_Order__c: "",
	attributes: {
		type: "",	url: ""
	}
};
// Denis Ivancik 16.9.2015 Time Registration page implementation
// _ITEM suffix because these objects will be line items in Work Hours Tab and Approval Summary
var WORK_HOUR_ITEM = {
	Id: "",	Start_Time__c: "",	End_Time__c: "",	Reported_Hours__c: "",	Location__c: "",
	Type__c: "",	Iime_Entry_Id: "",	Time_Report_Id: "",	Service_Order_ID: "", Comments__c: ""
};
var TIME_ENTRY_ITEM = {
	Resource_Name: "",	Reported_Hours_Sum: "",	Work_Hour_Items: []
};
var TIME_REPORT_ITEM = {
	Report_Date: "",	Reported_Hours_Total: "",	Time_Entry_Items: {}
};
// Denis Ivancik 3.9. added these objects/templates to be able to upsert SWR/TKIC records to SmartStore
var SWR_FILE = {
	Id: "",	Name: "",	Service_Work_Report_Name__c: "",	Service_Order_ID__c: "",
	Extension: "",	Installation__c: "",	_soupEntryId: "",
	attributes: {
		type: "",	url: ""
	}
};
var TKIC_FILE = {
	Id: "",	Name: "",	Article_Version_Id__c: "",	Title: "",	Main_Type__c: "",
	SubType__c: "",	_soupEntryId: "",	Date__c: "", Extension: "",
	attributes: {
		type: "",	url: ""
	}
};

var SALES_ORDER_LINE = {
	Id: "",	Name: "",	Orderer_Name__c: "",	Overall_Delivery_Status__c: "",	SparePartLine: {}
};
var SPARE_PARTS_LINE = {
	Id: "",	Quantity__c: 0,	Internal_Material_Description__c: "",	materialNumber__c: ""
};
//Synchronization Object
var SYNC_MOBILE_DATA = {
	JSON_Data__c: "",	ObjectName__c: "",	Status__c: "",	ApplicationVersion__c: "",	Installation_Name__c: ""
};
var SAVE_CALLBACK = {
	Id: "",	success: true,	errors: []
};
//JSON Data
var SOUP_EXIST = {name:"",result:""}; //Fetch from agr object function RegisterObject(obj)

var sfSmartstore = function() {return cordova.require("com.salesforce.plugin.smartstore");};
var sfOAuthPlugin = function() {return cordova.require("com.salesforce.plugin.oauth");};
var logToConsole = function() {return cordova.require("com.salesforce.util.logger").logToConsole;};

function storeExternalError(error,extraInfo){
	try{
		if(LOG){
			LOG.store(error,extraInfo);
		}else{
			logToConsole()("ErrorHandler class is not loaded. Could not store an error");
		}
	}catch(Pokemon){
		logToConsole()('Error when storing External Error:\n'+Pokemon.stack);
	}
}

function mainObject() {
	this.fsManager  ; // Object for File System
	this.userData ; // Pointer for information about logged user
	this.forcetkClient;
	this.sfSmartstore;
	this.Id = "";
	this.ParentIds = []; //ParentIds for Attachment
	//this.CountRecords = {}; //
	//this.SkipedJob = [];
	this.MessagesPage;
	this.Initialization = function(){ //this initialized all object in this object
		try{
			if((MessagesPage===null) || (MessagesPage===undefined)){
				MessagesPage = new MessagePage();
			}
			this.MessagesPage = MessagesPage;
		}catch(err){
			logToConsole()("mainObject Initialization Error: [ " + err.message + " ]");
			alert("mainObject Initialization: " + err.message);
		}
	};
}