/*
  @Author: Juraj Ciljak, Mathias
  @email:juraj.ciljak@accenture.com
  @LastModified: 16.6.2015,16.03.2015; 15.03.2015
  @Description:class for operation with SmartStore Data and Fetch it from SFDC
  @WARNING: callback function do not have parameters, be careful if using '' or ""
*/

//Move all the functions in DataManager.js to the object as in many cases example ServiceOrderCOntroller,..

var DataManager = new fDataManager();

function fDataManager(){

	"use strict";

	function LogOut(){
		var win = confirm("Would you like to log out?\nYou will lose all data!");
		if (win === true) {
			sfOAuthPlugin().logout();
		}
	}

	//Checks whether there is a Soup registered with the given SoupName.
	//There is a slight problem; this is done asynchronous, so the answer is not direct (difficult to use in if-statements)
	function SoupExist(soupName, onSoupExists, onSoupDoesNotExist){
		var result = false;
		try{
			sfSmartstore().soupExists(soupName, 
				function(param){
					//The checkup was a success, pass the value to the result variable (true/false)
					result = param;
					if(onSoupExists !== undefined && onSoupDoesNotExist !== undefined){
						if(result === true)
							onSoupExists();
						else
							onSoupDoesNotExist();
					}
				},
				function(err){
					//There was an error with the checkup on the Smartstore client.
					onErrorRegSoup(err);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_WARNING,"Check SOUP: "+soupName+" exist error");
				}
			);
		}
		catch(err){
			logToConsole()("registerSoup: "+soupName+" - " + err.message);
			alert("DataManager method soupExist threw an error: " + err.message); 
			return false;
		}
		return result;
	}

	function createTable(Parameters,JobLine){
		var registrations = [
			{Name:SOUP_ERROR_LOG,Indexes:"IDX_ERROR_LOG"},
			{Name:SOUP_USER_TABLE,Indexes:"IDX_USER_TABLE"},
			{Name:SOUP_RESOURCE,Indexes:"IDX_RESOURCE"},
			{Name:SOUP_ASSIGNED_RESOURCE,Indexes:"IDX_ASSIGNED_RESOURCE"},
			{Name:SOUP_OPERATION_TABLE,Indexes:"IDX_OPERATIONS_TABLE"},
			{Name:SOUP_WORK_ORDER,Indexes:"IDX_WORK_ORDER"},
			{Name:SOUP_WORK_ORDER_FEED,Indexes:"IDX_WORK_ORDER_FEED_TABLE"},
			{Name:SOUP_FEEDCOMMNETS,Indexes:"IDX_FEEDCOMMENT_TABLE"},
			{Name:SOUP_DOC_TABLE,Indexes:"IDX_DOC_TABLE"},
			{Name:SOUP_INSTALLATIONS_TABLE,Indexes:"IDX_INSTALLATION_TABLE"},
			{Name:SOUP_EQUIPMENT_TABLE,Indexes:"IDX_EQUIPMENT_TABLE"},
			{Name:SOUP_TI_ARTICLE_ASSIGNMENT_TABLE,Indexes:"IDX_TI_ARTICLE_ASSIGNMENT_TABLE"},
			{Name:SOUP_TI_ARTICLE_KAV,Indexes:"IDX_TI_ARTICLE_KAV"},
			{Name:SOUP_SALES_ORDER,Indexes:"IDX_SALES_ORDER_TABLE"},
			{Name:SOUP_SPARE_PARTS,Indexes:"IDX_SPARE_PARTS_TABLE"},
			{Name:SOUP_FSE_NOTES,Indexes:"IDX_FSE_NOTES"},
			{Name:SOUP_FS_COORDINATOR_NOTES,Indexes:"IDX_FS_COORDINATOR_NOTES"},
			{Name:SOUP_JOB_SAFETY_ANALYSIS_FEED,Indexes:"IDX_JOB_SAFETY_ANALYSIS_FEED_TABLE"},
			{Name:SOUP_BATCH_TEMP_TABLE,Indexes:"IDX_BATCH_TEMP_TABLE"},
			{Name:SOUP_BATCH_TEMP_ATTACHEMENT_TABLE,Indexes:"IDX_BATCH_TEMP_ATTACHEMENT_TABLE"},
			{Name:SOUP_JSA_ACTIVITIES_TABLE,Indexes:"IDX_JSA_ACTIVITIES_TABLE"},
			{Name:SOUP_JOB_SAFETY_ANALYSIS_TABLE,Indexes:"IDX_JOB_SAFETY_ANALYSIS_TABLE"},
			{Name:SOUP_INCIDENT_TABLE,Indexes:"IDX_INCIDENT_TABLE"},
			{Name:SOUP_TIME_REPORT,Indexes:"IDX_TIME_REPORT"},
			{Name:SOUP_TIME_ENTRY,Indexes:"IDX_TIME_ENTRY"},
			{Name:SOUP_WORK_HOURS,Indexes:"IDX_WORK_HOURS"},
			{Name:SOUP_SWR_TABLE,Indexes:"IDX_SWR"},
			{Name:SOUP_SWR_CONTENT_DOC_LINK,Indexes:"IDX_SWR_CONT_DOC_LINK"},
			{Name:SOUP_SWR_CONTENT_VERSION,Indexes:"IDX_SWR_CONT_VERSION"},
			{Name:SOUP_APPROVALS,Indexes:"IDX_APPROVAL"},
			{Name:SOUP_TASK,Indexes:"IDX_TASK"}
		];

		function registerOneSoup(index, callback){
			try{
				if(index>=registrations.length){
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:100,Display:true},true);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:100,Display:true},true);
					callback();
				}else{
					var percent = Math.round(100 * index / registrations.length);
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:percent,Display:true},true);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:percent,Display:true},true);
					var sTable = registrations[index];
					SmartStores.registerSoup(sTable.Name,tableIndex[sTable.Indexes],
						function(success){
							logToConsole()(sTable.Name+" database has been initialized.");
							registerOneSoup(index+1, callback);
						},
						function(error){
							logToConsole()("Could not register "+sTable.Name+" database:\n"+error);
							registerOneSoup(index+1, callback);
						}
					);
				}
			}catch(err){
				logToConsole()("registerOneSoup error:\n"+err);
			}
		}

		MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:0},true);
		MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Database",{ProgressValue:0},true);
		registerOneSoup(0,function(){
			if((Parameters!==undefined) && (JobLine!==undefined)){
				JobQueues.JobProcess(Parameters,JobLine);
			}
		});
	}

	function getSmartStoreServiceOrder(recordId,initLoading){
		try{
			var InitLoad = false;
			if(initLoading===true){InitLoad = true;}
			var Params = {Ids:[], RecordId : "", ParentId:"", SQL : "SQLITE_WORK_ORDER", Page:"index.html", Init:InitLoad};
			ServiceOrder.ServiceOrderController(Params);
		}catch(err){
			alert("getSmartStoreServiceOrder:"+err.message);
		}
	}

	function cleanScreen(){
		MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"",undefined,false);
		MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"",undefined,false);
		$("#"+DIV_INDEX_SERVICE_ORDER_LIST).html("");
	}

	return{
		LogOut:LogOut,
		SoupExist:SoupExist,
		createTable:createTable,
		getSmartStoreServiceOrder:getSmartStoreServiceOrder,
		cleanScreen:cleanScreen
	};

}

function checkFieldValue(value,dataType,length){

	/* @Change in future create better parser */
	function formateDate(Value,Format){
		var result = Value;
		try{
			var res = Value.split("-");
			if((res!== undefined)&&(Format!==undefined)&&(res.length>1)&&(Format!==null)){
				var d = res[2];
				var m = res[1];
				var y = res[0];
				switch(Format.toLowerCase()){
					case "europe/helsinki":
						result = d + '.' + m + '.' + y;
						break;
					default:
						break;
				}
			}
		}
		catch(err){
			alert("Method formateDate throw error: " + err); 
		}
		return result;
	}

	//@Change in future create better parser and object and ....
	function formateDateTime(Value,Format){
		var result = Value;
		try{
			var res = Value.split("-");
			if((res!== undefined)&&(Format!==undefined)&&(res.length>1)&&(Format!==null)){
				var d =res[2];
				var m =res[1];
				var y = res[0];
				var time = d.split("T");
				var rest = "";
				var t = "";
				var h = "";
				var min = "";
				if(time !== undefined){
					d = time[0];
					rest = time[1];
				}
				if(rest !== undefined){
					t = rest.split(":");
				}
				if(t !== undefined){
					h = t[0];
					min = t[1];
				}
				switch(Format.toLowerCase()){
					case "europe/helsinki":
						result = d + '.' + m + '.' + y + ' ' + h + ':' + min;	
						break;
					default:
						break;
				}
			}
		}
		catch(err){
			alert("Method DataManager.formateDateTime throw error: " + err);
		}
		return result;
	}

	var result = "";
	try{
		if(value === undefined || value === null){
			switch(dataType.toLowerCase()){
				case "string" :
					result = VALUE_EMPTY;
					break;
				case "integer":
					result = "0";
					break;
				case "date":
					result = "----.--.--";
					break;
				case "datetime":
					result = "----.--.-- --:--:--";
					break;
				default:
					result=value;
					break;
			}
		}else{
			switch(dataType.toLowerCase()){
				case "string":
					if((length!==undefined) && (length<=value.length)){
						result = value.substring(0, length);
					}
					else {result = value;}
					break;
				case "date":
					result = formateDate(value,MainObject.userData.TimeZoneSidKey);
					break;
				case "datetime":
					result = formateDateTime(value,MainObject.userData.TimeZoneSidKey);
					break;
				default:
					result=value;
					break;
			}
		}
	}
	catch(err){
		result = "";
		alert("DataManager method checkFieldValue threw an error: " + err.message);
	}
	return result;
}

/*********************************************/
/***** SUCCESS / ERROR HANDLER FUNCTIONS *****/
/*********************************************/
function onSuccessRegSoup(param) {
	logToConsole()("onSuccessRegSoup: " + param);
}

function onErrorRegSoup(param) {
	logToConsole()("onErrorRegSoup: " + param);
	$("#div_soup_status_line").html("registerSoup ERROR");
}

function onSuccessClearSoup(soupName) { 
	//TODO: There was 'param' instead of soupName here, which resulted in errors.
	//I also commented out the notification, because it was irrelevant to the user. This should be re-evaluated -KH
	logToConsole()("onSuccessClearSoup: " + soupName);
}

function onErrorClearSoup(param) {
	logToConsole()("onErrorClearSoup: " + param);
	$("#div_soup_status_line").html("onErrorClearSoup ERROR");
}

function onErrorSoupExists(param) {
	logToConsole()("onErrorSoupExists: " + param);
	$("#div_soup_status_line").html("onErrorSoupExists ERROR");
}

function onSuccessSoupExists(param) {
	logToConsole()("onSoupExistsDone: " + param);
	SOUP_EXIST.result = param;
	$("#div_soup_status_line").html("Soup exists: " + param);
}