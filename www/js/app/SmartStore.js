/*
  @Author: Juraj Ciljak
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 10.12.2015; 
  @Description: Object for SmartStore Table
  @WARNING: 

*/

var SmartStores = new SmartStore();

function SmartStore()
{
	var Tables = [
		SOUP_ERROR_LOG,
		SOUP_USER_TABLE,
		SOUP_BATCH_TEMP_TABLE,/*needed for batch downloading*/
		SOUP_BATCH_TEMP_ATTACHEMENT_TABLE,
		SOUP_DOC_TABLE,/*needed for blobs and files*/
		SOUP_WORK_ORDER,
		SOUP_WORK_ORDER_FEED,
		SOUP_FEEDCOMMNETS,
		SOUP_OPERATION_TABLE,
		SOUP_ASSIGNED_RESOURCE,
		SOUP_RESOURCE,
		SOUP_INSTALLATIONS_TABLE,
		SOUP_EQUIPMENT_TABLE,
		SOUP_SWR_TABLE,
		SOUP_SWR_CONTENT_DOC_LINK,
		SOUP_SWR_CONTENT_VERSION,
		SOUP_TI_ARTICLE_ASSIGNMENT_TABLE,
		SOUP_FSE_NOTES,
		SFDC_FS_COORDINATOR_NOTES,
		SOUP_SALES_ORDER,
		SOUP_SPARE_PARTS,
		SOUP_JOB_SAFETY_ANALYSIS_TABLE,
		SOUP_JOB_SAFETY_ANALYSIS_FEED,
		SOUP_INCIDENT_TABLE,
		SOUP_JSA_ACTIVITIES_TABLE,
		SOUP_TIME_REPORT,
		SOUP_TIME_ENTRY,
		SOUP_WORK_HOURS,
		SOUP_APPROVALS,
		SOUP_TASK
	];

	function refreshNextSoup(index,callback){
		try{
			if(index>=Tables.length){
				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:100,Display:true},true);
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:100,Display:true},true);
				if(callback){
					callback();
				}
			}else{
				var percent = Math.round(100 * index / Tables.length);
				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:percent,Display:true},true);
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:percent,Display:true},true);
				sfSmartstore().clearSoup(Tables[index],
					function(input){
						refreshNextSoup(index+1,callback);
					}, 
					function(error){
						logToConsole()("Could not refresh soup "+Tables[index]+"\n"+error);
						refreshNextSoup(index+1,callback);
					});
			}
		}catch(err){
			alert("SmartStore.js - refreshNextSoup raised error:"+err);
		}
	}

	this.refreshSoups = function(nextFunction)
	{
		 // function for removing all registered soups - remove table
		try
		{
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:0},true);
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Cleaning up",{ProgressValue:0},true);
			refreshNextSoup(0,nextFunction);
			
		}catch(err)
		{
			logToConsole()("removeSoup Error: [ "+err.message+" ]");
		}
	};

	this.registerSoup = function(soupName,indexes,nextFunction,errorFunction)
	{
  		//Registering Soup to the SmartStore (tables)
		try
		{
			logToConsole("registerSoup: " + soupName);
			sfSmartstore().soupExists(soupName,function(exists){
				if(!exists){
					sfSmartstore().registerSoup(soupName, indexes, function(result){
						onSuccessRegSoup(result);
						if(nextFunction){
							nextFunction();
						}
					},
						function(err) {
							this.onErrorRegSoup(err);
							if(errorFunction){
								errorFunction();
							}
						}
					);
				}else{
					logToConsole()(soupName+" already exists");
					if(nextFunction){
						nextFunction();
					}
				}
			},function(error){
				alert("Error in registerSoup - sfSmartstore.soupExists:\n"+error);
				errorFunction();
			});
			/*
			var sp_Exist = false;
   			sp_Exist = DataManager.SoupExist(soupName,onSuccessSoupExists,onErrorSoupExists);
   			if(SOUP_EXIST.result === false) 
			{
				sfSmartstore().registerSoup(soupName, indexes, function(result){
					onSuccessRegSoup(result);
					if(nextFunction){
						nextFunction();
					}
				},
					function(err) {
						this.onErrorRegSoup(err);
						if(errorFunction){
							errorFunction();
						}
					}
				);
			}*/
		}
		catch(err)
		{
			logToConsole()("registerSoup: "+soupName+"; err:[ "+err.message+" ]");
			alert("SmartStore method registerSoup threw an error: " + err.message);
			if(nextFunction){
				nextFunction();
			}
		}
	};
	
	this.onErrorRegSoup = function(param) {
    	logToConsole()("onErrorRegSoup: " + param);
    	$("#div_soup_status_line").html("registerSoup ERROR");
	};
}