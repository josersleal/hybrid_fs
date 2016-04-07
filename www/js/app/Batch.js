/*
  @Authors: Juraj Ciljak:juraj.ciljak@accenture.com
  @Description: Object for process batch request to the SFDC
  @LastModify: 4.9. Denis Ivancik - code optimization and readability improvement
*/
var Batchs = new Batch();

function Batch(){

	"use strict";

	var CLASS_NAME="Batch";
	var vars = {};

	this.getStartJobQueueProcessFetchingData = function(parameters,jobLine){
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR);
		try{
			var SQL_PARAMS = SQLTable[jobLine.SQL];
			var ClearTable = JobQueues.getClearTable();
			var JobName = jobLine.MainType;
			if(SQL_PARAMS!==undefined){
				var iLimit = SQL_PARAMS.LIMIT;
				var WHERE = SQL_PARAMS.WHERE;
				var SOUP_SQL= SQL_PARAMS.SQL;
				var sORDERBY = SQL_PARAMS.ORDERBY;
				var rWHERE="";
				JobName = jobLine.MainType;

				var DataSet = jobLine.DataSet;
				var MainJob = JobQueues.getJob(DataSet.MainJob,DataSet.StartOrder);
				var OffSet;
				if(MainJob!==undefined){
					OffSet  = MainJob.OffSet;
					//JC 18.07.2015
					switch (jobLine.Name){
						case FETCH_ATTACHEMENT_HEAD :
							OffSet = ClearTable.Attachement;
							break;
						case FETCH_CURRENT_USER:
						case FETCH_USERS :
							OffSet = ClearTable.Users;
							break;
						default:
							break;
					}
				}else{
					alert("Batchs.getStartJobQueueProcessFetchingData has undefined MainJob");
					alert(JSON.stringify(jobLine));
				}
				var TotalPages = Math.ceil(OffSet.SmartDataCount/iLimit); //Something like pagination
				jobLine.Status = VALUE_START;
				var OFFSET = (jobLine.OffSet.OffSet*iLimit);
				jobLine.OffSet.OffSet+=1;

				if(jobLine.OffSet.OffSet==1){
					jobLine.OffSet.ClearTable=true;
				}
				else{
					jobLine.OffSet.ClearTable=false;
				}
				if(jobLine.OffSet.OffSet<TotalPages){ //TotalPages
					parameters.StartOrder = parameters.StartOrder-1;
				}
				else{
					if(jobLine.OffSet.OffSet>TotalPages){
						jobLine.Status = VALUE_FINISH;
						//MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_WARNING,VALUE_DOWNLOAD_LIMIT,ProcessBar); 
						JobQueues.JobProcess(parameters,jobLine);
						return false;
					}
				}
				var Params = {Ids:[], VariableType : "String", ReplaceValue : ":OFFSET", VariableValue : OFFSET};
				rWHERE = ReplaceSQLParameters(WHERE,Params);
				Params = {Ids:[], VariableType : "String", ReplaceValue : ":LIMIT", VariableValue : iLimit.toString()};
				rWHERE = ReplaceSQLParameters(rWHERE,Params);
				logToConsole()("SOQL for "+jobLine.ShowText+" [ " + SOUP_SQL+rWHERE+sORDERBY + " ]");

				var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+rWHERE+sORDERBY , iLimit);
				sfSmartstore().runSmartQuery(querySpec, function(cursor) {
					var page = cursor.currentPageOrderedEntries;
					//finish with this job
					if(page.length<=0){
						jobLine.Status = VALUE_SYNC;
						JobQueues.JobProcess(parameters,jobLine);
						return false;
					}
					else{
						var entry, sId="", ParentIds = "", IdList = [];
						switch (jobLine.Name){
							case "fetch_AttachementsBody":
							case "fetch_FeedBody":
							case "fetch_JSAFeedBody":
								Batchs.getDocBlobField(parameters,jobLine,page);
								break;
							default:
								for (var i = 0,j=page.length; i < j; i++){
									entry = page[i];
									sId = entry[0];
									if((sId) && (sId!=='null')){
										IdList.push("'"+sId+"'");
									}
								}
								if(IdList.length>0){
									ParentIds = " "+SQL_PARAMS.REPLACE_COLUMN+" IN ("+IdList+") ";
									getBatchJobProcessFetchingData(parameters,jobLine,page,ParentIds);
								}
								else{
									JobQueues.JobProcess(parameters,jobLine); 
								}
								break;
						}
					}
				},function(error){
					LOG.store(error,{"SOQL":querySpec});
				});
			}
			else{
				parameters.Status = VALUE_NO_PARAM_QUERY;
				LOG.store("SQL_PARAMS are undefined",{"Where":"Batchs - getStartJobQueueProcessFetchingData","parameters":parameters,"jobLine":jobLine});
				JobQueues.JobProcess(parameters,jobLine);
			}
		}
		catch(err){
			LOG.store(err,{"parameters":parameters,"jobLine":jobLine});
			ProcessBar.ProgressValue= 100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
			ProcessBar.Text = jobLine.ShowText;
			parameters.Status = VALUE_THROW_ERROR;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_THROW_ERROR,ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_THROW_ERROR,ProcessBar);
			JobQueues.JobProcess(parameters,jobLine);
		}
	};

	this.getDocBlobField = function(parameters,jobLine,page){
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
		try{
			var sql_PARAMS = SQLTable[jobLine.SQL];  
			if(jobLine && sql_PARAMS){
				jobLine.Status=VALUE_START;
				ProcessBar.ProgressValue= 100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
				if(sql_PARAMS!==undefined){
					for(var i = 0, j = page.length; i < j; i++){
						var entry = page[i];
						var Id = entry[0];
						var name = entry[1];
						if(Id && Id!=='null'){
							forcetkClient.retrieveBlobField(sql_PARAMS.TABLE, Id , sql_PARAMS.REPLACE_COLUMN, function(resp) {
								MainObject.fsManager.createFileBlob("["+Id+"]"+name,resp);
								ProcessBar.Text="File: "+name+" - downloading";
								ProcessBar.Text = jobLine.ShowText;//TODO: check which one will show message and delete other
								MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"File: "+name,ProcessBar);
								MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"File: "+name,ProcessBar);
								JobQueues.JobProcess(parameters,jobLine);
							},function(err2){
								LOG.store(err2,{"Where":"Batch - getDocBlobField - retrieveBlobField","Table":sql_PARAMS.TABLE,"Id":Id,"Field":sql_PARAMS.REPLACE_COLUMN});
								jobLine.Status = VALUE_ERROR_FETCH;
								ProcessBar.Text = jobLine.ShowText;
								MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,VALUE_ERROR_DOWNLOAD+" "+jobLine.ShowText,ProcessBar);
								MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,VALUE_ERROR_DOWNLOAD+" "+jobLine.ShowText,ProcessBar);
								JobQueues.JobProcess(parameters,jobLine);
							});
						}
					}
				}
			}
		}catch(err){
			LOG.store(err,{"Where":"Batch - getDocBlobField","parameters":parameters,"jobLine":jobLine});
			alert("Object "+CLASS_NAME+", method getDocBlobField throw error:"+err.message);
			ProcessBar.Text = jobLine.ShowText;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,VALUE_ERROR_DOWNLOAD+" "+jobLine.ShowText,ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,VALUE_ERROR_DOWNLOAD+" "+jobLine.ShowText,ProcessBar);
			JobQueues.JobProcess(parameters,jobLine);
		}
	};

	function getBatchJobProcessFetchingData(parameters,jobLine,entry,Ids){
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
		try{
			ProcessBar.ProgressValue = 100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
			ProcessBar.Text = jobLine.ShowText;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);
			var ClearTable = JobQueues.getClearTable();
			var sql_PARAMS = SQLTable[jobLine.SQL];  
			if(sql_PARAMS){
				//SOQL_FETCH is the SOQL query used to get data from SFDC
				var SOQL_FETCH = SQLTable[sql_PARAMS.RELATED_SQL];
				if(SOQL_FETCH){
					jobLine.Status = VALUE_START;
					var SOQL = SOQL_FETCH.SQL;
					var rWHERE = SOQL_FETCH.WHERE;
					var Params = { Ids : [], VariableType : "String", ReplaceValue : ":PRIds", VariableValue : Ids };
					rWHERE = ReplaceSQLParameters(rWHERE, Params);
					var OrderBy = " " + SOQL_FETCH.ORDERBY;
					var iLimit = SOQL_FETCH.LIMIT;
					var OFFSET = 0;
					//Add filtering to the SOQL query
					SOQL += " " + rWHERE + OrderBy + " LIMIT " + iLimit.toString() + " OFFSET " + OFFSET.toString(); 
					logToConsole()("SOQL for  [ " + SOQL + " ]");
					var entries;
					forcetkClient.query(SOQL,
						function(response){
							//Fetch successful
							if ((jobLine.Attachement == VALUE_YES) && (jobLine.ObjectType != "Feed")){
								ClearTable.Attachement.SmartDataCount += response.totalSize;
								JobQueues.updateClearTable(ClearTable);
							}
							jobLine.OffSet.SmartDataCount += response.totalSize;
							entries = response.records;
							if(SOQL_FETCH.TABLE == SFDC_WORK_ORDER_FEED || SOQL_FETCH.TABLE == SFDC_JOB_SAFETY_ANALYSIS_FEED){
								SmartStoreManager.ExtractDataComments(entries);
							}
							if(entries && entries.length > 0){
								SmartStoreManager.SaveDataToSmartStoreJobProcess(response, parameters, jobLine, '');
							}
							else{
								JobQueues.JobProcess(parameters, jobLine);
							}
						},
						function(error){//Fetch failed.
							LOG.store(error,{"Where":"Batch - getBatchJobProcessFetchingData","SOQL":SOQL,"jobLine":jobLine});
							ProcessBar.ProgressValue = 100;
							jobLine.Status = VALUE_ERROR_SOQL;
							ProcessBar.Text = jobLine.ShowText;
							MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
							MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
							alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
							JobQueues.JobProcess(parameters, jobLine);
						}
					);
				}else{
					LOG.store("Batchs.getBatchJobProcessFetchingData() -> SOQL_FETCH was undefined",{"parameters":parameters,"jobLine":jobLine});
				}
			}
		}
		catch(err){
			LOG.store(err,{"parameters":parameters,"jobLine":jobLine,"entry":entry,"Ids":Ids});
			ProcessBar.ProgressValue = 100;
			jobLine.Status = VALUE_ERROR_SOQL;
			ProcessBar.Text = jobLine.ShowText;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
			alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
			JobQueues.JobProcess(parameters, jobLine);
		}
	}

	this.getBatchJobCustomerApprovalData = function(parameters,jobLine){
		try{
			vars = {};
			vars.Parameters = parameters;
			vars.JobLine = jobLine;
			var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR);
			ProcessBar.ProgressValue = 100;
			var ShowText = vars.JobLine.ShowText;
			var SQL_PARAMS = SQLTable[vars.JobLine.SQL];
			var QUERY = SQL_PARAMS.SQL + SQL_PARAMS.WHERE + SQL_PARAMS.ORDERBY;
			logToConsole()("SQLite for  [ " + QUERY + " ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY , SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				vars.page = cursor.currentPageOrderedEntries;
				if(vars.page.length > 0){
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					BatchCreateSFDCRecord(0);
				}
				else{
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					setTimeout(function(){
						vars.JobLine.Status = VALUE_SYNC;
						vars = {};
						JobQueues.JobProcess(parameters,jobLine);
					}, 1000);
				}
			},function(error){
				LOG.store(error,{"Where":"Batch - getBatchJobCustomerApprovalData - runSmartQuery","querySpec":querySpec,"jobLine":jobLine});
				alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
			});
		} catch(err) {
			LOG.store(err,{"Where":"Batch - getBatchJobCustomerApprovalData","parameters":parameters,"jobLine":jobLine});
			alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
		}
	};

	function BatchCreateSFDCRecord(Index){
		if(Index >= vars.page.length){
			JobQueues.JobProcess(vars.Parameters,vars.JobLine);
			delete vars.page;
			return;
		}
		try{
			var SQL_PARAMS = SQLTable[vars.JobLine.SQL];
			var Sync_Data = jQuery.extend(true, {}, SYNC_MOBILE_DATA);
			var entries =  DataTransManager.DataTrans_PushData(vars.page[Index], vars.JobLine);
			Sync_Data.JSON_Data__c = JSON.stringify(entries);
			Sync_Data.ObjectName__c = SQL_PARAMS.TABLE; 
			Sync_Data.Status__c = VALUE_START_SYNC;
			Sync_Data.ApplicationVersion__c = API_VERSION;
			if(entries.Installation_Name__c !== undefined && entries.Installation_Name__c !== null){
				Sync_Data.Installation_Name__c = entries.Installation_Name__c;
			}
			forcetkClient.create(SQL_PARAMS.SYNC_TABLE, Sync_Data, 
				function(callback){
					BatchCreateSFDCRecord(Index+1);
				},
				function(error){
					LOG.store(error,{"Where":"Batch - BatchCreateSFDCRecord - forcetkClient.create","SyncData":Sync_Data});
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
					alert('Class '+CLASS_NAME+', BatchCreateSFDCRecord raised an error: ' + error);
					BatchCreateSFDCRecord(Index+1);
				});
		}
		catch(err){
			LOG.store(err);
			BatchCreateSFDCRecord(Index+1);
			alert('Class '+CLASS_NAME+',BatchCreateSFDCRecord raised an error: '+err.message);	
		}
	}

}