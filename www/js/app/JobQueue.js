/*
  @Author: Juraj Ciljak, 
  @email: juraj.ciljak@accenture.com
  @Version: 2.0
  @LastModified: 9.7.2015,16.03.2015; 15.03.2015
  @Description:class for processing Jobs in Asynchronous call
  @WARNING:  Too complex
*/

var JobQueues = new JobQueue();

function JobQueue(){

	//variable is set to true when fetching data starts, it prevents download when device is already in process of downloading
	var isDownloading = false;
	
	//Property which tells if the table should be clear
	//it is set on the start fetching data not from OffSet.ClearTable
	//because for example I may fetch attachment from many objects
	//users we are fetching in two steps Current user and then rest user specify by profile

	var ClearTable = { 
		Users : { RecordCount : 0, OffSet : 0, ClearTable : true, SmartDataCount : 0 },
		Attachement : { RecordCount : 0, OffSet : 0, ClearTable : true, SmartDataCount : 0 } 
	};
	//Returns the empty table defined above.
	this.getClearTable = function(){
		return ClearTable;
	};

	this.updateClearTable = function(updatedTable){
		try{
			if(updatedTable !== undefined){
				ClearTable = updatedTable;
			}
		}
		catch(err){
			storeExternalError(err,updatedTable);
		}
	};

	//Returns a modified version of the variable 'parameters'
	this.SwitchNextJobs = function(parameters, JobLineItems){
		var Result = parameters;
		try{
			if(parameters !== undefined){
				if(JobLineItems && JobLineItems.NextJob.MainJob){
					Result.MainJob = JobLineItems.NextJob.MainJob;
					Result.Status = VALUE_START;
					Result.JobType = parameters.JobType;
					switch(parameters.JobType){
						case VALUE_JOB_TYPE_SINGLE :
							Result.StartOrder = JobLineItems.NextJob.StartOrder;
							break;
						case VALUE_JOB_TYPE_MULTI:
							Result.StartOrder = 1; 
							break;
						default:
							break;
					}
				}else{
					if(parameters !== undefined){
						switch(parameters.JobType){					
							case VALUE_JOB_TYPE_SINGLE :
								parameters.JobType = VALUE_JOB_TYPE_NON;
								break;					
							case VALUE_JOB_TYPE_MULTI:
								break;
							default:
								break;
						}
					}
				}
			}
			return Result;
		}
		catch(err){			
			storeExternalError(err,{"Where":"JobQueue - SwitchNextJobs","parameters":parameters,"JobLineItems":JobLineItems});
			return parameters;
		}		
	};
	
	//This function is part of a recursion loop!
	//This function determines which function should be run for a specific jobName
	//TODO: rename this function to something more intuitive as ParseJobname, determineJobAction or something similar...
	this.CaseJobs = function(parameters,jobLine){
		try{
			if((parameters !== undefined) && (jobLine !== undefined)){
				var jobName = jobLine.Name;
				var passParams;
				switch(jobName){
					case "createTable":
						DataManager.createTable(parameters,jobLine);
						break; 
					case "get_UserData":
						passParams = { Ids:[], RecordId : MainObject.userData.Id,ParentId:"", SQL : "SQLITE_GET_CURRENT_USER_DATA", Page:"index.html",
							Parameters: parameters, JobLine: jobLine	
						}; 
		 				Users.UserController(passParams);
						break;
					case "get_List_WorkOrder":
						passParams = { Ids:[], RecordId : "",ParentId:"", SQL : "SQLITE_WORK_ORDER", Page:"index.html",
							Parameters: parameters, JobLine: jobLine,Init:true	
						}; 							
						ServiceOrder.ServiceOrderController(passParams);
						break;
					//Maria Ciskova 26.8.2015
					//after loading application this job executes and starts downloading automatically if there are no service orders already in app
					case "get_Data_From_Salesforce":
						passParams = { Ids:[], RecordId : "",ParentId:"", SQL : "SQLITE_WORK_ORDER", Page:"index.html",
							Parameters: parameters, JobLine: jobLine,Init:true	
						};
						JobQueues.checkIfDataAlreadyInApp(passParams);
						break;
					case "fetch_WorkOrder":
					case "fetch_Current_User":
						JobQueues.getSfdcRecordsFetching(parameters,jobLine);
						break;
					//12.8.2015 Denis Ivancik - this will hide status bar after pushing of data
					case "push_CleanAfterPush":
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"",undefined,false);
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"",undefined,false);
						SmartStores.refreshSoups(function(){JobQueues.JobProcess(parameters,jobLine);});
						break;
					//updated Maria Ciskova - added clearing global variable isDownloading after fetching is finished, clearing local storage
					case "fetch_CleanAfterFetch":
						//in future define here some function for this
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"",undefined,false);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"",undefined,false);
						localStorage.removeItem(LOCAL_STORAGE_EQUIPMENT);
						JobQueues.isDownloading = false;
                        JobQueues.JobProcess(parameters,jobLine);
						break;
					//Fetching data by parent ID
					case "get_User_Resources":
					case "get_Task_Assigned_Resources":
					case "get_Operations":
					case "get_Service_Orders":
					case "get_All_Task_Assigned_Resources":
					case "get_All_Resources":
       	            case "fetch_Operations":
					case "fetch_AttachementsHeader":   
					case "fetch_WorkOrder_Feed":
					case "fetch_JSA_Feed":
					case "fetch_Installations":
					case "fetch_Equipments":
					case "fetch_SalesOrder":
					case "fetch_SpareParts":
					case "fetch_FS_Notes":
			 		case "fetch_FeedBody":
			 		case "fetch_JSAFeedBody":
					case "fetch_AttachementsBody":	 
					case "fetch_Time_Report":	 
					case "fetch_Resources": 
					case "fetch_Time_Entry":
					case "fetch_Work_Hours":							
					case "fetch_FS_Coordinator_Notes":
					case "fetch_SWR":
					case "fetch_Article_Assignments":
					case "fetch_Article_kav":
					case "fetch_SWR_ContentDocLink":
					case "fetch_SWR_ContentVersion":
					case "fetch_JSA_Activities":
					case "fetch_Incidents":
					case "fetch_Job_Safety_Analysis":
					case "fetch_Equipment_Tasks":
						Batchs.getStartJobQueueProcessFetchingData(parameters,jobLine);
						break;
					case "push_Data": 
						//Push Data
						//this.JobProcess(parameters);
						//SmartSyncManager.startPushSfdcData();
						break;
					case "update_JSA":
						SmartSyncManager.getSmartStoreDataForUpdate(parameters, jobLine);
						break;
					case "push_Errors":
					case "push_WorkOrder_Feed":
					case "push_JSA_feed":
					case "push_FeedComments":
					case "push_FSE_Notes":
					case "push_TimeReports": 
					case "update_JSA_Activities":
					case "push_Incidents":
					case "push_Tasks":
						SmartSyncManager.getSmartStoreData_N(parameters,jobLine);
						break;
					case "push_CustomerApprovals":
						Batchs.getBatchJobCustomerApprovalData(parameters,jobLine);
						break;
					case "sync_sfdcData":
						JobQueues.FetchDataFromSFDC();
						break;
					default:       	  
						break;       
				}
			}	
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - CaseJobs","parameters":parameters,"jobLine":jobLine});
			return parameters;	
		}
	};
	
	//This function is part of a recursion loop!
	//This function determines whether a single or multiple jobs are needed to be run.
	this.JobProcess = function(Parameters, jobLine){
		try{				 
			if(Parameters !== undefined){				
				switch(Parameters.JobType){ 					
					case VALUE_JOB_TYPE_SINGLE :
						this.ProcessSingleJob(Parameters, jobLine);
						break;
					case VALUE_JOB_TYPE_MULTI:
						this.ProcessMultipleJobs(Parameters, jobLine);
						break;
					default:
						break;
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - JobProcess","Parameters":Parameters,"jobLine":jobLine});
			return Parameters;	
		}
	};
	
	//This function is part of a recursion loop! It calls CaseJobs, which calls eventually this function again.
	//The cycle is something like ProcessSingleJob->CaseJobs->function X->JobProcess->ProcessSingleJob
	//Function X is usually outside this file which might be a bit confusing...
	this.ProcessSingleJob = function(Parameters, JobLine){
		try{
			if(Parameters !== undefined && Parameters.JobType == VALUE_JOB_TYPE_SINGLE){
				var MainJob = JobQueueTable[Parameters.MainJob];
				if(MainJob !== undefined){
					JobLine = MainJob[Parameters.StartOrder];
					if(JobLine !== undefined){
						Parameters = JobQueues.SwitchNextJobs(Parameters, JobLine);	
						JobLine.Status = VALUE_SYNC;
						JobQueues.CaseJobs(Parameters, JobLine);
						//After the caseJobs is finished, and no next job exists, stop the recursion loop by returning false
						if(!JobLine.NextJob.MainJob){ 
							return false;
						}
					}
					else{
						//stop recursion!
						JobQueues.isDownloading = false;
						return false;
					}
				}	
				else{ 
					//stop recursion!
					return false;
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - ProcessSingleJob","Parameters":Parameters,"jobLine":JobLine});
			return Parameters;	
		}
	};
	 
	//This function is part of a recursion loop! It calls CaseJobs which eventually calls this function again.
	this.ProcessMultipleJobs = function(Parameters,JobLine){
		try{ 
			if(Parameters !== undefined){
				var MainJob = JobQueueTable[Parameters.MainJob];
				if(MainJob !== undefined){
					var JobLength = Object.keys(MainJob).length;
					JobLine = MainJob[Parameters.StartOrder];
					if(JobLine !== undefined){
						if(JobLength >= Parameters.StartOrder){
							var jobName = Parameters.MainJob;
							if(JobLength == Parameters.StartOrder){
								Parameters = JobQueues.SwitchNextJobs(Parameters, JobLine);	
							}
							JobLine.Status = VALUE_FINISH;
							if(jobName !== Parameters.MainJob){
								//do not increase order if the parameters already set from SwitchNextJobs
							}
							else{	
								Parameters.StartOrder += 1;
							}
							JobQueues.CaseJobs(Parameters, JobLine);
						}
						else{//Stop recursion!
							return false;
						}
					}
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - ProcessMultipleJobs","Parameters":Parameters,"jobLine":JobLine});
		}
	};
	 
	//Fetch records from SFDC
	this.getSfdcRecordsFetching = function(Parameters,jobLine){
		var Params;
		var sText = "";
		var ProcessBar;
		try{
			var SQL_PARAMS = SQLTable[jobLine.SQL];
			ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
			var initQuery = "",subQUERY = "", SOQL = "";
			var iLimit = 1, sWHERE = "", rWHERE ="", OrderBy="", OFFSET = 0;
			var TableName = ""; var CountRecord ;
			if (SQL_PARAMS){
				sText = jobLine.ShowText;
				MessagesPage.ProgressValue+=1;
				ProcessBar.ProgressValue= 100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
				ProcessBar.Text = sText;
				//MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Downloading",ProcessBar);
				SOQL = SQL_PARAMS.SQL;
				sWHERE = SQL_PARAMS.WHERE;
				TableName = SQL_PARAMS.TABLE;
				iLimit = SQL_PARAMS.LIMIT;
				initQuery = SQL_PARAMS.INITQUERY;
				subQUERY = SQL_PARAMS.SUBQUERY;
				if(SQL_PARAMS.ORDERBY){
					OrderBy = " " + SQL_PARAMS.ORDERBY;
				}
			}
			CountRecord = jobLine.OffSet.RecordCount;
			jobLine.Status = VALUE_START;
			OFFSET = (jobLine.OffSet.OffSet*iLimit); 
			jobLine.OffSet.OffSet += 1;
			if(jobLine.OffSet.OffSet == 1){
				jobLine.OffSet.ClearTable = true;
			}
			else{
				jobLine.OffSet.ClearTable = false;
			}
			if((jobLine.OffSet.OffSet<=1) && (CountRecord>DOWNLOAD_OFFSET_LIMIT)){
				Parameters.StartOrder = Parameters.StartOrder - 1; 		
			}
			else{
				if(OFFSET>DOWNLOAD_OFFSET_LIMIT){
					jobLine.Status = VALUE_FINISH;
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_WARNING,VALUE_DOWNLOAD_LIMIT,ProcessBar);
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_WARNING,VALUE_DOWNLOAD_LIMIT,ProcessBar);
					JobQueues.JobProcess(Parameters,jobLine);
					return false;
				}
			}
			Params = {};
			rWHERE = sWHERE;
			Params = {Ids:[], VariableType : "String", ReplaceValue : ":PRuserId", VariableValue : MainObject.userData.Id};
			switch(jobLine.Name){
				case "fetch_WorkOrder":
					rWHERE = ReplaceSQLParameters(sWHERE,Params);
					initQuery = ReplaceSQLParameters(initQuery,Params);
					break;
				case "fetch_Current_User":
					rWHERE = ReplaceSQLParameters(sWHERE,Params);
					break;
				default:
					break;
			}
			if(jobLine.Name == "fetch_WorkOrder"){
				// make extra query from Where part, debug and store received IDs, then continue
				forcetkClient.query(initQuery, 
					function(response1){
						var IdList = "";
						for(var i=0,j = response1.records.length; i<j;i++){
							if(i!==0){
								IdList += ", ";
							}
							IdList += "'" + response1.records[i].Id + "'";
						}
						if(IdList === ""){
							IdList = "''";
						}
						Params.ReplaceValue = ":ResIds";
						Params.VariableValue = IdList;
						subQUERY = ReplaceSQLParameters(subQUERY,Params);
						forcetkClient.query(subQUERY, 
							function(response2){
								IdList = "";
								for(var i=0,j = response2.records.length; i<j;i++){
									if(i!==0){
										IdList += ", ";
									}
									IdList += "'" + response2.records[i].CKSW__WorkOrder__c + "'";
								}
								if(IdList === ""){
									IdList = "''";
								}
								rWHERE = " WHERE Id IN ("+IdList+") and (isDeleted=false) AND (CKSW__Status__c !='Completed') AND (CKSW__Status__c !='Cancel') ";
								//now continue with previous flow

								SOQL += " " + rWHERE + OrderBy + " LIMIT " + iLimit.toString() + " OFFSET " + OFFSET.toString(); 
								MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);
								MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);
								forcetkClient.query(SOQL, 
									function(response3){
										jobLine.OffSet.SmartDataCount += response3.totalSize;
										SmartStoreManager.SaveDataToSmartStoreJobProcess(response3,Parameters,jobLine,'');
										ProcessBar.Text = sText;
										MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Saving " + jobLine.ShowText, ProcessBar);
										MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Saving " + jobLine.ShowText, ProcessBar);
									},
									function(err) {
										jobLine.Status = VALUE_ERROR_SOQL;
										ProcessBar.Text = sText;
										MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
										MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar); 
										storeExternalError(err,{"Where":"JobQueue - getSfdcRecordsFetching","SOQL":SOQL,"Parameters":Parameters,"jobLine":jobLine});
										alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
										JobQueues.JobProcess(Parameters, jobLine);
									}
								);
								// end of previous flow
								},
							function(err) {
								jobLine.Status = VALUE_ERROR_SOQL;
								ProcessBar.Text = sText;
								MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
								MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
								storeExternalError(err,{"Where":"JobQueue - getSfdcRecordsFetching","subQUERY":subQUERY,"Parameters":Parameters,"jobLine":jobLine});
								alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
								JobQueues.JobProcess(Parameters, jobLine);
							}
						);
	  				},
					function(err) {
						jobLine.Status = VALUE_ERROR_SOQL;
						ProcessBar.Text = sText;
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
						storeExternalError(err,{"Where":"JobQueue - getSfdcRecordsFetching","initQuery":initQuery,"Parameters":Parameters,"jobLine":jobLine});
						alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
						JobQueues.JobProcess(Parameters, jobLine);
					});
			}
			else{
				SOQL += " " + rWHERE+OrderBy + " LIMIT " + iLimit.toString() + " OFFSET " + OFFSET.toString();
				//TODO: Is this the correct syntax?
				//Yup, it works
				logToConsole() ("SOQL for " + sText + " [ " + SOQL + " ]");
				//31.8.2015 I added this line to tell the user when the data is actually being downloaded -KH
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);
				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Downloading " + jobLine.ShowText, ProcessBar);

				forcetkClient.query(SOQL, 
					function(response){	
						jobLine.OffSet.SmartDataCount += response.totalSize;
						SmartStoreManager.SaveDataToSmartStoreJobProcess(response,Parameters,jobLine,'');
						ProcessBar.Text = sText;
						//31.8.2015 I changed this to 'saving' to tell the use when something is being saved. -KH
	 					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Saving " + jobLine.ShowText, ProcessBar);
	 					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Saving " + jobLine.ShowText, ProcessBar);
	 					//JobQueues.JobProcess(Parameters,jobLine);
						//queryMorePrototype() //Prototype
					},
					function(err){
						jobLine.Status = VALUE_ERROR_SOQL;
						ProcessBar.Text = sText;
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, VALUE_ERROR_SOQL, ProcessBar);
						storeExternalError(err,{"Where":"JobQueue - getSfdcRecordsFetching","SOQL":SOQL,"Parameters":Parameters,"jobLine":jobLine});
						alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
						JobQueues.JobProcess(Parameters, jobLine);
					}
				);
			}
		}
		catch(err){
			Parameters.Status = VALUE_EXCEPTION;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_ERROR, Parameters.Status + " downloading: " + sText, ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_ERROR, Parameters.Status + " downloading: " + sText, ProcessBar);
			storeExternalError(err,{"Where":"JobQueue - getSfdcRecordsFetching","Parameters":Parameters,"jobLine":jobLine});
			alert(SFDC_SYNC_ERROR+"("+jobLine.ShowText+")");
			JobQueues.JobProcess(Parameters, jobLine);
		}
	};

	//the param "Parameters" is not used, so it should be removed.
	//jobLine: the jobline which contains the next job the offset is applied to.
	this.setOffSet = function(Parameters, jobLine, Count, OffSet, ClearTable, SmartDataCount){
		try{
			if(jobLine !== undefined){
				var NextJob = jobLine.NextJob;
				if(NextJob !== undefined){
					var nextMainJob = NextJob.MainJob;
					var nextStartOrder = NextJob.StartOrder;
					var nextJobs = JobQueueTable[nextMainJob];
					var jobItem;
					if(nextJobs !== undefined){
						jobItem = nextJobs[nextStartOrder];
						jobItem = JobQueues.ChangeOffsetProperties(jobItem, Count, OffSet, ClearTable, SmartDataCount);
					}
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - setOffSet","Parameters":Parameters,"jobLine":jobLine,"Count":Count,"OffSet":OffSet,"ClearTable":ClearTable,"SmartDataCount":SmartDataCount});
		}
	};

	this.StartProcessList =  function(mainJob,jobType){
		try{ 
			var Prms = { MainJob : mainJob, NextJob : "", Status : VALUE_START, StartOrder : 1, JobType : jobType };
			JobQueues.JobProcess(Prms);
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - StartProcessList","mainJob":mainJob,"jobType":jobType});
		}
	};

	//A function that goes through the given JobTable, and passes the parameters given to every item
	//in that table. Or actually to item.Offset
	//TODO: Is this function actually doing anything? It is called only from one place, and nothing is done with the return value.
	//does the var JobTable = JobQueues.getJobQueueTable(); make a hard copy of the JobQueueTable, or does it get a reference to the orig?
	//If only a soft copy, then this function has a purpose, otherwise it does not.
	this.CleanProcessTable = function(Count, OffSet, ClearTable, SmartDataCount){
		//Get the JobQueueTable which contains all the Jobs
		var JobTable = JobQueues.getJobQueueTable();
		var Result;
		try{
			//Go through all the elements in JobTable
			for (var key in JobTable){
				if(JobTable.hasOwnProperty(key)){
					var Jobs = JobTable[key];
					if (Jobs !== undefined){
						//Go through all the Jobs in the element
						for (var Job in Jobs){
							if(Jobs.hasOwnProperty(Job)){
								var JobItem = Jobs[Job];
								JobItem = JobQueues.ChangeOffsetProperties(JobItem, Count, OffSet, ClearTable, SmartDataCount);
							}
						}
					}
				}
			}
			Result = JobTable;
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - CleanProcessTable","Count":Count,"OffSet":OffSet,"ClearTable":ClearTable,"SmartDataCount":SmartDataCount});
			Result = undefined;
		}
		finally{
			return Result;
		}
	};
	
	//A function clean up the code somewhat as this operation is done at least twice
	//JobItem: the item to which the offset properties are to be set
	//Count, OffSet, ClearTable, SmartDataCount: The values that should be set.
	this.ChangeOffsetProperties = function(JobItem, Count, OffSet, ClearTable, SmartDataCount){
		try{
			if(JobItem !== undefined){
				if(JobItem.OffSet !== undefined){
					//Default the values on JobItem.Offset
					JobItem.OffSet.RecordCount = 0; 
					JobItem.OffSet.OffSet = 0;
					JobItem.OffSet.ClearTable = false;
					JobItem.OffSet.SmartDataCount = 0;
					//Pass the parameter values to JobItem.Offset
					if(Count){
						JobItem.OffSet.RecordCount = Count; 
					}
					if(OffSet){
						JobItem.OffSet.OffSet = OffSet; 
					}
					if(ClearTable){
						JobItem.OffSet.ClearTable = ClearTable; 
					} 
					if(SmartDataCount){
						JobItem.OffSet.SmartDataCount = SmartDataCount; 
					}
				}
			}
		}catch(err){
			storeExternalError(err,{"Where":"JobQueue - ChangeOffsetProperties","JobItem":JobItem,"Count":Count,"OffSet":OffSet,"ClearTable":ClearTable,"SmartDataCount":SmartDataCount});
		}
		return JobItem;
	};
	
	//A function to clean the ClearTable with the parameters given.
	this.CleanClearTable = function(Count, OffSet, ClearTable, SmartDataCount){
		//Get the empty table defined in the beginning of this file.
		var clrTable = JobQueues.getClearTable();
		var Result;
		try{
			//Go through each element in JobTable
			for(var key in clrTable){
				if(clrTable.hasOwnProperty(key)){
					var Jobs = clrTable[key];
					if (Jobs !== undefined){
						if(Jobs.RecordCount !== undefined){
							Jobs.RecordCount = 0; 
							if((Count !== undefined) && (Count !== '')){
								Jobs.RecordCount = Count; 
							}
						}
						if(Jobs.OffSet !== undefined){
							Jobs.OffSet = 0;
							if((OffSet !== undefined) && (OffSet !== '')){
								Jobs.OffSet = OffSet; 
							}
						}
						if(Jobs.ClearTable !== undefined){
							Jobs.ClearTable = true;
							if((ClearTable !== undefined) && (ClearTable !== '')){
								Jobs.ClearTable = ClearTable; 
							}
						}
						if(Jobs.SmartDataCount !== undefined){
							Jobs.SmartDataCount = 0;
							if((SmartDataCount !== undefined) && (SmartDataCount !== '')){
								Jobs.SmartDataCount = SmartDataCount; 
							}
						}
					}
				}
			}
			Result = clrTable;
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - ChangeOffsetProperties","Count":Count,"OffSet":OffSet,"ClearTable":ClearTable,"SmartDataCount":SmartDataCount});
			Result = undefined;
		}
		finally{
			if (Result !== undefined){
				//Put the newly cleaned table as the cleared table
				JobQueues.updateClearTable(Result);
			}
		}
	};

	//Count: Apparently a useless parameter as it is set to 1 before passed on. I removed it (28.7.2015) -KH
	//Offset:
	//ClearTable: a boolean value passed on to CleanClearTable and CleanProcessTable 
	//SmartDataCount:
	this.InitJobProcess = function(OffSet, ClearTable, SmartDataCount){
		try{
			//Setting default value for offset property from JobQueueTable and ClearTable
			//clean template table
			logToConsole()("InitJobProcess");
			sfSmartstore().clearSoup(SOUP_BATCH_TEMP_ATTACHEMENT_TABLE, onSuccessClearSoup, onErrorClearSoup); 
			sfSmartstore().clearSoup(SOUP_BATCH_TEMP_TABLE, onSuccessClearSoup, onErrorClearSoup); 
			sfSmartstore().clearSoup(SOUP_DOC_TABLE, onSuccessClearSoup, onErrorClearSoup); 

			var Count = 1;
			//Clean the clear table. 
			//This function is used only here
			JobQueues.CleanClearTable(Count, OffSet, ClearTable, SmartDataCount);

			//Clean the JobQueueTable. Why does CleanProcessTable even return a value as it is not used?
			//This function is used only here.
			JobQueues.CleanProcessTable(Count, OffSet, ClearTable, SmartDataCount);
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - InitJobProcess","OffSet":OffSet,"ClearTable":ClearTable,"SmartDataCount":SmartDataCount});
			return undefined;
		}
	};

	this.getJob = function(mainJob, StartOrder){
		var Result;
		try{
			if(mainJob !== undefined){
				var Jobs = JobQueueTable[mainJob];
				if(Jobs !== undefined){
					var Job = Jobs[StartOrder];	
					if(Job !== undefined){
						Result = Job;
					}
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - InitJobProcess","mainJob":mainJob,"StartOrder":StartOrder});
		}
		return Result;
	};

	//This function is called only from the sidebar in index.html (at least on 28.7.2015)
	//This function starts a job that gets data from SFDC
	this.FetchDataFromSFDC = function(){
		try{
			//if(JobQueues.isDownloading !== true)
			//{
				//JobQueues.isDownloading = true;
				var connected = 'onLine' in navigator && navigator.onLine;
				if(connected === true){
					JobQueues.InitJobProcess(0, true, 0);// reset Offset

					//Define the parameters needed in JSON form.
					//MainJob is one of the jobs from JobQueueTable
					var Params = { MainJob : "fetch_Data", NextJob : "", Status : VALUE_START, StartOrder : 1, JobType : VALUE_JOB_TYPE_MULTI };
					//Start the recursion loop for the jobs.
					logToConsole()("FetchDataFromSFDC");
					JobQueues.JobProcess(Params);
				}
				else{
					alert("Sorry, no internet connection!");
					JobQueues.isDownloading = false;
				}
			//}
			//else
				//alert("Downloading is still in process, please wait until download is finished.");
			}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - FetchDataFromSFDC"});	
		}
	};
	
	//Maria Ciskova 26.8.2015
	//function checks if some service orders are already in the app,
	//if no, automatic download of data from Salesforce is executed
	this.checkIfDataAlreadyInApp =  function(Parameters){
		try{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			logToConsole()("SQLite for  [ " + SOUP_SQL+sWHERE + sORDERBY+" ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var response = cursor.currentPageOrderedEntries;
				if((response===null) || (response.length<=0)){
					JobQueues.FetchDataFromSFDC();
				}
			},function(error){
				storeExternalError(error,{"Where":"JobQueue - checkIfDataAlreadyInApp - runSmartQuery","querySpec":querySpec});
			});
		}
		catch(err){
			storeExternalError(err,{"Where":"JobQueue - checkIfDataAlreadyInApp","Parameters":Parameters});
		}
	};

	//returns the whole JobQueueTable
	//these getter functions are not really necessary when using global variables. If being strict, then they would be useful.
	this.getJobQueueTable = function(){ return JobQueueTable; };
	var JobQueueTable = 
	{
		"onDeviceReady" : {
						1 : { 	Name : "createTable", Status : "START", ObjectType : "",
								NextJob : { MainJob : "", StartOrder : 0 },
								JobType : "", IsAsynchron : false, SQL : "", MethodManager : "",
								ShowText : "Creating tables"
							},
						2 : { 	Name : "get_UserData", Status : "START", ObjectType : "",
								NextJob : { MainJob : "", StartOrder : 0 },
								JobType : "", IsAsynchron : true, SQL : "SQLITE_GET_CURRENT_USER_DATA", MethodManager : "",
								ShowText : "User Data"
							},
						3 : { 	Name : "get_List_WorkOrder", Status : "START", ObjectType : "",
								NextJob : { MainJob : "", StartOrder : 0 },
								JobType : "", IsAsynchron : true, SQL : "SQLITE_WORK_ORDER", MethodManager : "",
								ShowText : "Service Order"
							},
						//Maria Ciskova 26.8.2015
						4 : { 	Name : "get_Data_From_Salesforce", Status : "START", ObjectType : "",
								NextJob : { MainJob : "", StartOrder : 0 },
								JobType : "", IsAsynchron : true, SQL : "", MethodManager : "",
								ShowText : "Starting Download Data from Salesforce"
							}
				},

	"fetch_Data" : {
						1 : { 	Name :"fetch_Current_User", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								JobType:"",IsAsynchron: true, SQL:"ALT_SOQL_CURRENT_USER", MethodManager:"getCurrentUser",
								Attachement:"No",Value:"",ShowText:"Current User",
								Type:"JobTable",Feed:"No", Batch:"No"
							},
						2 : { 	Name :"get_User_Resources", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"ALT_USER_RES", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"User Resources",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						3 : { 	Name :"get_Task_Assigned_Resources", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:2},
								JobType:"",IsAsynchron: true, SQL:"ALT_RES_OAR", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Operation Assigned Resources",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						4 : { 	Name :"get_Operations", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:3},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ALT_OPERATION_TAR", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Operations",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						5 : { 	Name :"get_Service_Orders", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:4},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ALT_SERVICE_ORDER_OPERATION_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Service Orders",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},	
						6 : { 	Name :"fetch_Operations", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:5},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_OPERATIONS_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"All Operations",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						7 : { 	Name :"get_All_Task_Assigned_Resources", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:6},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ALT_TAR_OPERATION_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Operation Assigned Resources",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						8 : { 	Name :"get_All_Resources", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:7},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ALT__RESOURCE_TAR_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"All Resources",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						9 : { 	Name :"fetch_Installations", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_INSTALLATIONS_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"Yes",Value:"",ShowText:"Installations",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						10: { 	Name :"fetch_Equipments", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_EQUIPMENTS_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Equipments",
								Type:"JobTable",Feed:"No", Batch:"No"
							},
						11: { 	Name :"fetch_Job_Safety_Analysis", Status:"START", ObjectType:"",
								NextJob : { MainJob : "", StartOrder : 0 },	
								OffSet : { RecordCount : 0, OffSet : 0, ClearTable : false, SmartDataCount : 0 },
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType : "", IsAsynchron : true, SQL : "SQLITE_JOB_SAFETY_ANALYSIS_WORK_ORDER_IDS_BATCH", MethodManager : "",
								Attachement : "No", Value : "", ShowText : "Job Safety Analysis",
								Type : "JobTable", Feed : "No", Batch:"Yes"
							},
						12 : { 	Name :"fetch_SalesOrder", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:9},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_SALES_ORDER_INSTALLATIONS_IDS_BATCH", MethodManager:"getSmartStoreServiceOrder",
								Attachement:"No",Value:"",ShowText:"Sales Order",
								Type:"JobTable",Feed:"No", Batch:"No"
							},	
						13 : { 	Name :"fetch_SpareParts", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:12},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_SPARE_PARTS_SALES_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Spare Parts",
								Type:"JobTable",Feed:"No", Batch:"No"
							},	
						14 : { 	Name :"fetch_FS_Notes", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_FSE_NOTES_OPERATIONS_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"FS Engineer Notes",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						15 : { 	Name :"fetch_FS_Coordinator_Notes", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_FS_COORDINATOR_NOTES_OPERATIONS_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"FS Coordinator Notes",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						16 : { 	Name :"fetch_Time_Report", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TIME_REPORT_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"isFeed",ShowText:"Time Report",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						17 : { 	Name :"fetch_Time_Entry", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:16},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TIME_ENTRY_TIME_REPORT_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"isFeed",ShowText:"Time Entry",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						18 : { 	Name :"fetch_Work_Hours", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:17},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_WORK_HOURS_TIME_ENTRY_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"isFeed",ShowText:"Work Hours",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						19 : { 	Name :"fetch_WorkOrder_Feed", Status:"START", ObjectType:"Feed",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_WORK_ORDER_FEED_BATCH", MethodManager:"",
								Attachement:"Yes",Value:"isFeed",ShowText:"Service Order Feeds",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						20 : { 	Name :"fetch_FeedBody", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:19},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_WO_FEED_BODY_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"isFeed",ShowText:"Body of Feed Attachment",
								Type:"JobTable",Feed:"No", Batch:"No"
							},	
						21 : { 	Name :"fetch_JSA_Feed", Status:"START", ObjectType:"Feed",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_JSA_FEED_BATCH", MethodManager:"",
								Attachement:"Yes",Value:"isFeed",ShowText:"JSA Feeds",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						22 : { 	Name :"fetch_JSAFeedBody", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:21},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_JSA_FEED_BODY_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"isFeed",ShowText:"Body of Feed Attachment",
								Type:"JobTable",Feed:"No", Batch:"No"
							},	
						23 : { 	Name :"fetch_JSA_Activities", Status:"START", ObjectType:"",
								NextJob : { MainJob : "", StartOrder : 0 },	
								OffSet : { RecordCount : 0, OffSet : 0, ClearTable : false, SmartDataCount : 0 },
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType : "", IsAsynchron : true, SQL : "SQLITE_JSA_WORK_ORDER_IDS_BATCH", MethodManager : "",
								Attachement : "No", Value : "", ShowText : "JSA Activities",
								Type : "JobTable", Feed : "No", Batch:"Yes"
							},
							//Maria Ciskova 24.8.15
						24 : { 	Name :"fetch_SWR", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_SWR_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Service Work Reports",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						25 : { 	Name :"fetch_Article_Assignments", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TI_ARTICLE_ASSIGNMENT_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Article Assignments",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						26 : { 	Name :"fetch_Article_kav", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:25},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TI_ARTICLE_KAV_TIA_ASSIGNMENT_BATCH", MethodManager:"checkDownloadedTKIC",
								Attachement:"No",Value:"",ShowText:"Article Assignments kav",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						27 : { 	Name :"fetch_AttachementsHeader", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ATTACHEMENT_WORK_ORDER_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Header of Attachment",
								Type:"JobTable",Feed:"No", Batch:"No"
							},
						28 : { 	Name :"fetch_AttachementsBody", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:27},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ATTACHEMENT_BODY_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Body of Attachment",
								Type:"JobTable",Feed:"No", Batch:"No"
							},
						29 : { 	Name :"fetch_Incidents", Status:"START", ObjectType:"",
								NextJob : { MainJob : "", StartOrder : 0 },	
								OffSet : { RecordCount : 0, OffSet : 0, ClearTable : false, SmartDataCount : 0 },
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType : "", IsAsynchron : true, SQL : "SQLITE_INCIDENT_INSTALLATION_BATCH", MethodManager : "",
								Attachement : "No", Value : "", ShowText : "Incidents",
								Type : "JobTable", Feed : "No", Batch:"Yes"
							},
						//Maria Ciskova 24.8.15
						30 : { 	Name :"fetch_SWR_ContentDocLink", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_CONTENT_DOCUMENT_LINK_SWR_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"TKIC ContentDocumentLink",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						//Maria Ciskova 24.8.15
						31 : { 	Name :"fetch_SWR_ContentVersion", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_CONTENT_VERSION_CONTDOCLINK_IDS_BATCH", MethodManager:"checkDownloadedSWR",
								Attachement:"No",Value:"",ShowText:"TKIC ContentVersion",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},
						//Maria Ciskova 4.2.16
						32 : { 	Name :"fetch_Equipment_Tasks", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"fetch_Data",StartOrder:1},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TASKS_EQUIPMENTS_IDS_BATCH", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Equipment Tasks",
								Type:"JobTable",Feed:"No", Batch:"Yes"
							},	
						33 : { 	Name :"fetch_CleanAfterFetch", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								OffSet:{RecordCount:0,OffSet:0,ClearTable:false,SmartDataCount:0},
								DataSet:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"", MethodManager:"",
								Attachement:"No",Value:"",ShowText:" ",
								Type:"JobTable",Feed:"No", Batch:"No"
							},
						34 : { 	Name : "get_List_WorkOrder", Status : "START", ObjectType : "",
								NextJob : { MainJob : "", StartOrder : 0 },
								JobType : "", IsAsynchron : true, SQL : "SQLITE_WORK_ORDER", MethodManager : "",
								ShowText : "Service Order"
							}
				},

	"fetch_JSA" : {
						1 : { 	Name :"fetch_JSA_Activities", Status:"START", ObjectType:"",
								NextJob : { MainJob : "", StartOrder : 0 },	
								OffSet : { RecordCount : 0, OffSet : 0, ClearTable : false, SmartDataCount : 0 },
								JobType : "", IsAsynchron : true, SQL : "SOQL_JSA_ACTIVITIES", MethodManager : "",
								Attachement : "No", Value : "", ShowText : "JSA Activities",
								Type : "JobTable", Feed : "No"
							}
	},

	"push_Data" : {
						1 : {
								Name :"push_Errors", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_ERRORS_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Preparing to Upload",
								Type:"JobTable",Feed:"No"
							},
						2 : { 	Name :"push_WorkOrder_Feed", Status:"START", ObjectType:"Feed",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_WORK_ORDER_FEED_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Sync Service Orders Feed",
								Type:"JobTable",Feed:"Yes"
							},
						3 : { 	Name :"push_FeedComments", Status:"START", ObjectType:"FeedComment",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_FEED_COMMENTS_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Sync Feed Comments",
								Type:"JobTable",Feed:"No"
							},
						4 : { 	Name :"push_FSE_Notes", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_OPERATIONS_AND_FSE_NOTES_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Sync FSE Notes",
								Type:"JobTable",Feed:"No"
							},
						5 : { 	Name :"push_TimeReports", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TIME_REPORT_TIME_ENTRY_WORK_HOURS_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Sync Time Reports",
								Type:"JobTable",Feed:"No"
							},
						6 : {	Name :"push_CustomerApprovals", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_APPROVALS_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Sync Customer Approvals",
								Type:"JobTable",Feed:"No"
							},
						7 : {	Name :"push_Incidents", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_INCIDENTS_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Syncing Incidents",
								Type:"JobTable",Feed:"No"
							},
						8 : {	Name :"update_JSA", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_JSA_UPDATE", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Syncing JSA",
								Type:"JobTable",Feed:"No"
							},
						9 : {	Name :"update_JSA_Activities", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_JSA_ACTIVITY_UPDATE", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Syncing JSA Activities",
								Type:"JobTable",Feed:"No"
							},
						10 : {	Name :"push_JSA_feed", Status:"START", ObjectType:"Feed",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_JSA_FEED_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Syncing SiteSafety",
								Type:"JobTable",Feed:"No"
							},
						11 : {	Name :"push_Tasks", Status:"START", ObjectType:"sObject",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"SQLITE_TASK_PUSH", MethodManager:"",
								Attachement:"No",Value:"Feed Data",ShowText:"Syncing Reports",
								Type:"JobTable",Feed:"No"
							 },
						12 : { 	Name :"push_CleanAfterPush", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"", MethodManager:"",
								Attachement:"No",Value:"",ShowText:" ",
								Type:"JobTable",Feed:"No"
							},
						13 : {	Name :"sync_sfdcData", Status:"START", ObjectType:"",
								NextJob:{MainJob:"",StartOrder:0},
								JobType:"",IsAsynchron: true, SQL:"", MethodManager:"",
								Attachement:"No",Value:"",ShowText:"Starting Download Data from Salesforce",
								Type:"JobTable",Feed:"No"
							}
				}
	};
}