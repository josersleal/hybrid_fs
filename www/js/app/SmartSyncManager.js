/*
  @Author: Juraj Ciljak
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 14.10.2015; 
  @Description: JS Object for handling ongoing asynchronous jobs
  @WARNING: 

*/

var SmartSyncManager = new SyncManager();

function SyncManager()
{
	var CLASS_NAME = "SyncManager";

	this.startPushSfdcData = function()
	{
		try
		{
			if(JobQueues.isDownloading !== true)
			{
				JobQueues.isDownloading = true;
				//check for Internet connection
				var connected = 'onLine' in navigator && navigator.onLine;
				if(connected)
				{
					var Prms = { MainJob : "push_Data", NextJob : "", Status : VALUE_START, StartOrder : 1, JobType : "MULTI", Parameters : {} };
					JobQueues.JobProcess(Prms);
				}
				else
				{
					alert("You are not connected to the Internet. Upload not possible.");
					JobQueues.isDownloading = false;
				}
			}else{
				alert("Synchronization is still in process, please wait until synchronization is finished.");
			}
		}
		catch(err)
		{
			storeExternalError(err);
			alert("Method startPushSfdcData rise error: " + err.message);
		}
	};

	//The parameter 'entry'' is the list of items to be upserted
	this.SmartSyncSaveFeed = function(Parameters, JobLine, entry)
	{
		var entries = [];
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Progress bar 
		ProcessBar.ProgressValue = 100;
		try
		{
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS, MSG_OK, "Starting Sync Feeds", ProcessBar);
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS, MSG_OK, "Starting Sync Feeds", ProcessBar);
			for (var i = 0; i < entry.length; i++)
			{
				entries.length = 0;
				var ent = entry[i];
				var item = ent[0];
				var ParentId = item.ParentId;
				var escapedBody = JSON.stringify(item.Body).escapeSpecialChars();
				if(item.pictureUri !== undefined && item.pictureUri !== "")
				{
					//There is a picture for this item
					//Resolve its local URI, and get the actual binary data of the object
					window.resolveLocalFileSystemURI(item.pictureUri, 
						function(fileEntry){
							fileEntry.file(function(file)
								{
									var reader = new FileReader();
									//Define event handler. What will happen when the data load is complete?
									reader.onload = function()
									{
										//Binary data is loaded! Pass it on to the postChatterFeedItemWithFile method.
										MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Sync Feed:" + item.Body,ProcessBar);
										MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Sync Feed:" + item.Body,ProcessBar);
										forcetkClient.postFeedItemWithFile(ParentId, JSON.parse(escapedBody), file.name, reader.result,
											function(success){
												item.SaveStatus = VALUE_SAVE_SYNC;
												var reponse = success["id"]; // funny from SFDC that return id in lowercase
												if (reponse !== undefined)
												{
													item.Id= reponse;
												}
												else
												{
													reponse = success["Id"];
													if (reponse!==undefined)
													{
														item.Id= reponse;
													}
												}
												entries.push(item);
												SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_YES);
											},
											function(obj, status, response){
												item.SaveStatus = VALUE_ERROR_SYNC;
												//TODO: Why are we pushing the item to the entries even though it failed to send?
												entries.push(item);
												MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:" + item.Body,ProcessBar);
												MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:" + item.Body,ProcessBar);
												SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_NO);
												alert(SFDC_SYNC_ERROR+"(Sync of Chatter Feeds)");
											}, false);
									};
									//Read the file!
									reader.readAsBinaryString(file);
								}, 
								function(err)
								{
									//Error finding the file
									alert("FileEntry.file threw an error: " + err);
								});
						},
						function(err)
						{
							//error
							alert("window.resolveFileSystemUri threw an error: " + err);
						});
				}
				else
				{
					//No picture attached
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Sync Feed:" + item.Body,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Sync Feed:" + item.Body,ProcessBar);
					forcetkClient.postChatterItem(ParentId, JSON.parse(escapedBody),
					function(success){
						item.SaveStatus = VALUE_SAVE_SYNC;
						var reponse = success["id"]; // funny from SFDC that return id in lowercase
						if (reponse !== undefined)
						{
							item.Id= reponse;
						}
						else
						{
							reponse = success["Id"];
							if (reponse!==undefined)
							{
								item.Id= reponse;
							}
						}
						entries.push(item);
						SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_YES);
					},
					function(obj, status, response)
					{
						item.SaveStatus = VALUE_ERROR_SYNC;
						entries.push(item);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:"+item.Body,ProcessBar);
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:"+item.Body,ProcessBar);
						SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_NO);
						alert("SmartSyncManager method SmartSyncSaveFeed(postChatterItem) threw an error: "+response);
					});
				}
			}
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine,"entry":entry});
			alert("SmartSyncManager method SmartSyncSaveFeed threw an error: " + err.message);
		}
	};

	this.SmartSyncCreateSFDCRecord = function(Parameters, JobLine, entry)
	{
		var entries;
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar 
		ProcessBar.ProgressValue=100;
		var call_back ;
		var SQL_PARAMS = SQLTable[JobLine.SQL];
		var SFDC_TABLE = SQL_PARAMS.SYNC_TABLE;  //'SyncMobileData__c';
		try
		{
			var Sync_Data;
			// Denis Ivancik, 22th July 2015, added generic method
			entries =  DataTransManager.DataTrans_PushData(entry, JobLine); // that calls the correct Transform for jobLine
			if(JobLine.Name === "push_Incidents" || JobLine.Name === "push_Tasks")
			{
				//HACK: This is to ensure, that Denis' implementation does not break.
				//I don't fully understand how the Sync_Data object works, so I'm not going to tamper with it -KH
				SmartSyncManager.CreateMultipleSFDCRecords(entries, SFDC_TABLE,
					function(callback, pictureUris)
					{
						//Get the newly created record Id so that we can upload the attachments for that record.
						var IncidentId = callback.id;
						if(pictureUris !== undefined && pictureUris !== "")
						{
							var attachments = pictureUris.split(";");
							//incident
							SmartSyncManager.ConvertFileUriToFileEntries(attachments, function(fileEntries)
							{
								//A recursive function called immediately after initialization.
								//This function handles callbacks in a recursive manner so that all attachments are uploaded in sequence.
								(function(files, parentId)
								{
									var i = 0;
									function forloop()
									{
										if(i < files.length)
										{
											var reader = new FileReader();
											//Define event handler. What will happen when the data load is complete?
											reader.onload = function()
											{
												MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Uploading picture:" + files[i].name ,ProcessBar);
												MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Uploading picture:" + files[i].name,ProcessBar);
												forcetkClient.uploadAttachment(parentId, files[i].name, reader.result,
													function(success)
													{
														i++;
														forloop();
													},
													function(error)
													{
														storeExternalError(error,{"Response":error.responseText});
														alert("Error when uploading attachment!\n\n" + error.responseText);
														i++;
														forloop();
													}, true);
											};
											//Read the file!
											reader.readAsBinaryString(files[i]);
										}
										else
										{
											//All attachments are uploaded
											MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Uploading Incident",ProcessBar);
											MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Uploading Incident",ProcessBar);
										}
									}
									forloop();
								})(fileEntries, IncidentId);
							});
							MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Uploading Incident",ProcessBar);
							MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Uploading Incident",ProcessBar);
						}
					},
					function(err)
					{
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
						storeExternalError(err,{"Where":"SmartSyncManager.CreateMultipleSFDCRecords","SFDC_TABLE":SFDC_TABLE,"entries":entries,"full Error":JSON.stringify(err)});
						alert("Following error occurred when uploading multiple records ("+SFDC_TABLE+"):\n"+JSON.stringify(err));
					},
					function()
					{
						//This is the final callback, when everything is done!
						JobQueues.JobProcess(Parameters, JobLine);
					});
			}
			else
			{
				Sync_Data = jQuery.extend(true, {}, SYNC_MOBILE_DATA);
				Sync_Data.JSON_Data__c = JSON.stringify(entries);
				Sync_Data.ObjectName__c = SQL_PARAMS.TABLE;
				Sync_Data.Status__c = VALUE_START_SYNC;
				Sync_Data.ApplicationVersion__c = API_VERSION;
				forcetkClient.create(SFDC_TABLE, Sync_Data,
					function(callback) {
						call_back = jQuery.extend(true, {}, SAVE_CALLBACK);
						call_back.Id = callback.id;
						call_back.success = callback.success;
						call_back.errors = callback.errors;
						entry.SaveStatus = VALUE_SAVE_SYNC;
						//SmartStoreManager.SaveDataToSmartStoreJob(entry,Parameters,JobLine,VALUE_YES);
						JobQueues.JobProcess(Parameters, JobLine);
					},
					function(error) {
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SYNC,ProcessBar);
						storeExternalError(error,{"Where":"SmartSyncCreateSFDCRecord - not incident nor task","SFDC_TABLE":SFDC_TABLE,"Sync_Data":Sync_Data,"Parameters":Parameters,"JobLine":JobLine,"entry":entry});
						JobQueues.JobProcess(Parameters, JobLine);
					});
			}
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine,"entry":entry});
			JobQueues.JobProcess(Parameters, JobLine);
			alert('Class '+CLASS_NAME+',SmartSyncCreateSFDCRecord rise error: '+err.message);
		}
	};

	this.SmartSyncSaveFeedComment = function(Parameters,JobLine,entry)
	{
		var entries = [];
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar 
		ProcessBar.ProgressValue=100;
		try
		{
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"Starting Sync Feed Comment",ProcessBar);
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"Starting Sync Feed Comment",ProcessBar);
			for (var i = 0; i < entry.length; i++)
			{
				entries.length = 0;
				var ent = entry[i];
				var item = ent[0];
				var ParentId = item.FeedItemId;
				var escapedBody = JSON.stringify(item.CommentBody).escapeSpecialChars();

				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK," Sync Feed Comment:"+item.CommentBody,ProcessBar);
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK," Sync Feed Comment:"+item.CommentBody,ProcessBar);
				
				forcetkClient.postChatterComment(ParentId,JSON.parse(escapedBody),
					function(sc){
						item.SaveStatus = VALUE_SAVE_SYNC;
						entries.push(item);
						SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_YES);
					},
					function(err){
						item.SaveStatus = VALUE_ERROR_SYNC;
						entries.push(item);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:"+item.CommentBody,ProcessBar);
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,"Error Sync Feed:"+item.CommentBody,ProcessBar);
						SmartStoreManager.SaveDataToSmartStoreJob(entries,Parameters,JobLine,VALUE_NO);
						alert(SFDC_SYNC_ERROR+"(Chatter Feed Upload)");
					}
				);
			}
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine,"entry":entry});
			alert(SFDC_SYNC_ERROR+"(Chatter Feed Upload)");
		}
	};

	this.getSmartStoreDataForUpdate = function(Parameters, JobLine)
	{
		try
		{
			var SQL_PARAMS = SQLTable[JobLine.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar 
			ProcessBar.ProgressValue = 100;
			var ShowText = JobLine.ShowText;
			var WHERE = sWHERE;

			logToConsole()("SQLite for  [ " + SOUP_SQL+WHERE +sORDERBY + " ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY , iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {

				var page = cursor.currentPageOrderedEntries;
				if(page.length > 0) 
				{
					var entry = page;
					SmartSyncManager.UpdateSFDCRecord(Parameters, JobLine, entry);
				}
				else
				{
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					//wait 1 sec to show user that app is doing something during his upload. Even if he modified nothing.
					//Otherwise he would think that app is doing nothing and upload does not begin.
					setTimeout(function(){
						JobLine.Status = VALUE_SYNC;
						JobQueues.JobProcess(Parameters,JobLine);
					}, 1000);
				}
			});
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine});
			alert('Class '+CLASS_NAME+', getSmartStoreDataForUpdate raised error: '+err.message);
		}
	};

	this.getSmartStoreData_N =  function(Parameters,JobLine)
	{
		try
		{
			var SQL_PARAMS = SQLTable[JobLine.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar 
			ProcessBar.ProgressValue = 100;
			var ShowText = JobLine.ShowText;
			var WHERE = sWHERE;

			logToConsole()("SQLite for  [ " + SOUP_SQL+WHERE +sORDERBY + " ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY , iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				if(page.length > 0) 
				{
					var entry = page;
					switch(JobLine.ObjectType)
					{
						case OBJECT_TYPE_FEED :
							Parameters.StartOrder +=-1; 
							SmartSyncManager.SmartSyncSaveFeed(Parameters,JobLine,entry);
							break;
						case OBJECT_TYPE_FEED_COMMENTS :
							Parameters.StartOrder +=-1; 
							SmartSyncManager.SmartSyncSaveFeedComment(Parameters,JobLine,entry);
							break;
						default:
							//Parameters.StartOrder +=-1; 
							//Parameters.Status = VALUE_ERROR_SYNC;
							MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
							MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
							SmartSyncManager.SmartSyncCreateSFDCRecord(Parameters,JobLine,entry);
							break;
					}
				}
				else
				{
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,ShowText,ProcessBar);
					//wait 1 sec to show user that app is doing something during his upload. Even if he modified nothing.
					//Otherwise he would think that app is doing nothing and upload does not begin.
					setTimeout(function(){
						JobLine.Status = VALUE_SYNC;
						JobQueues.JobProcess(Parameters,JobLine);
					}, 1000);
				}
			});
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine});
			alert(SFDC_SYNC_ERROR+"("+JobLine.ShowText+")");
		}
	};

	this.UpdateSFDCRecord = function(Parameters, JobLine, entry)
	{
		var entries;
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar 
		ProcessBar.ProgressValue=100;
		var SQL_PARAMS = SQLTable[JobLine.SQL];
		var SFDC_TABLE = SQL_PARAMS.SYNC_TABLE;
		var recordsToUpdate = 0;
		try
		{
			entries =  DataTransManager.DataTrans_PushData(entry, JobLine);
			$.each(entries, function(i, record)
			{
				recordsToUpdate++;
				forcetkClient.update(SFDC_TABLE, record.Id, record.Fields, 
					function(success)
					{
						recordsToUpdate--;
						if(recordsToUpdate === 0)
						{
							//All callbacks received.
							JobQueues.JobProcess(Parameters,JobLine);
						}
					},
					function(err)
					{
						recordsToUpdate--;
						JobLine.Status = VALUE_ERROR_SOQL;
						ProcessBar.Text=JobLine.ShowText;
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
						alert("Error updating record: " + err);
						if(recordsToUpdate === 0)
						{
							//All callbacks received.
							JobQueues.JobProcess(Parameters,JobLine);
						}
					});
			});
		}
		catch(error)
		{
			storeExternalError(error,{"Parameters":Parameters,"JobLine":JobLine,"entry":entry});
			alert("SmartSyncManager method UpdateSFDCRecord threw an error: " + error);
		}
	};

	//Fetch Count of records
	this.getSfdcCountRecords = function(Parameters,JobLine)
	{
		var Params;
		var JobName = "";
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
		var sText = "";
		try
		{
			var SQL_PARAMS = SQLTable[JobLine.SQL];
			var SOQL = "";
			var TableName = "";
			var rWHERE="";
			if ((SQL_PARAMS!==null) && (SQL_PARAMS!==undefined))
			{
				JobName = JobLine.MainType;
				sText = JobLine.ShowText;
				ProcessBar.ProgressValue=100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
				MessagesPage.ProgressValue=100; 
				ProcessBar.Text = sText;
				SOQL = SQL_PARAMS.SQL;
				sWHERE = SQL_PARAMS.WHERE;
				TableName = SQL_PARAMS.TABLE;
			}
			
			SOQL+= " " + sWHERE; 
			logToConsole()("SOQL getSfdcCountRecords: [ " + SOQL + " ]");
			var RecCount = 0;
			var records ;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Preparing to download",ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Preparing to download",ProcessBar);

			forcetkClient.query(SOQL, 
				function(response) {
					records = response.records;
						
					if((records!==null) && (records.length>0))
					{
						RecCount = records[0].RecCount;
					}
					JobQueues.setOffSet(Parameters,JobLine,RecCount,0,false,0);
					JobLine.Status = VALUE_SYNC;
					ProcessBar.Text=sText;
					JobQueues.JobProcess(Parameters,JobLine);
				},
				function(err) {
					JobLine.Status = VALUE_ERROR_SOQL;
					ProcessBar.Text=sText;
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
					alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
					JobQueues.JobProcess(Parameters,JobLine);
				}
			);
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine});
			JobLine.Status = VALUE_EXCEPTION;
			ProcessBar.Text=JobLine.Status+" getting count of "+sText;
			logToConsole()("Object "+CLASS_NAME+", method getSfdcCountRecords throw exception: [ " + err + " ]");
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,"ERROR",JobLine.Status,ProcessBar); 
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,"ERROR",JobLine.Status,ProcessBar);
			alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
			JobQueues.JobProcess(Parameters,JobLine);  // check why i can use this
		}
	};

	this.getSfdcCountWorkOrders = function(Parameters,JobLine)
	{
		var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
		try
		{
			var SQL_PARAMS = SQLTable[JobLine.SQL];
			ProcessBar.ProgressValue=100;//(100/this.getJobCount())*MessagesPage.ProgressValue;
			MessagesPage.ProgressValue=100;
			ProcessBar.Text = JobLine.ShowText;
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_INFO,"Preparing to download",ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_INFO,"Preparing to download",ProcessBar);

			var firstQuery = SQL_PARAMS.INITQUERY;
			var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":PRuserId", VariableValue : MainObject.userData.Id};
			firstQuery = ReplaceSQLParameters(firstQuery,replaceParams);
			logToConsole()("SOQL for getSfdcCountWorkOrders:"+firstQuery);
			forcetkClient.query(firstQuery, 
				function(response) {
					var IdList = "";
					for(var i=0,j = response.records.length; i<j;i++){
						if(i!==0){
							IdList += ", ";
						}
						IdList += "'" + response.records[i].Id + "'";//CKSW__WorkOrder__c
					}
					if(IdList === ""){
							IdList = "''";
					}

					replaceParams.ReplaceValue = ":ResIds";
					replaceParams.VariableValue = IdList;
					var secondQuery = ReplaceSQLParameters(SQL_PARAMS.SUBQUERY,replaceParams);
					logToConsole()("SOQL for getSfdcCountWorkOrders:"+secondQuery);
					forcetkClient.query(secondQuery,function(response){
						IdList = "";
						for(var i=0,j = response.records.length; i<j;i++){
							if(i!==0){
								IdList += ", ";
							}
							IdList += "'" + response.records[i].CKSW__WorkOrder__c + "'";
						}
						if(IdList === ""){
							IdList = "''";
						}
						replaceParams.ReplaceValue = "subquery";
						replaceParams.VariableValue = IdList;
						var thirdQuery = SQL_PARAMS.SQL + ReplaceSQLParameters(SQL_PARAMS.WHERE,replaceParams);
						logToConsole()("SOQL for getSfdcCountWorkOrders:"+thirdQuery);
						forcetkClient.query(thirdQuery,
							function(response) {
								var RecCount = 0;
								if((response.records!==null) && (response.records.length>0))
								{
									RecCount = response.records[0].RecCount;
								}
								JobQueues.setOffSet(Parameters,JobLine,RecCount,0,false,0);
								JobLine.Status = VALUE_SYNC;
								JobQueues.JobProcess(Parameters,JobLine);  
							},function(err) {
								JobLine.Status = VALUE_ERROR_SOQL;
								ProcessBar.Text=JobLine.ShowText;
								MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar); 
								MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
								alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
								JobQueues.JobProcess(Parameters,JobLine);
							});
					},function(err){
						JobLine.Status = VALUE_ERROR_SOQL;
						ProcessBar.Text=JobLine.ShowText;
						MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
						MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
						alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
						JobQueues.JobProcess(Parameters,JobLine);
					});
				},
				function(err) {
					JobLine.Status = VALUE_ERROR_SOQL;
					ProcessBar.Text=JobLine.ShowText;
					MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
					MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_ERROR,VALUE_ERROR_SOQL,ProcessBar);
					alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
					JobQueues.JobProcess(Parameters,JobLine);
				});
		}
		catch(err)
		{
			storeExternalError(err,{"Parameters":Parameters,"JobLine":JobLine});
			JobLine.Status = VALUE_EXCEPTION;
			ProcessBar.Text=JobLine.Status+" getting count of "+JobLine.ShowText;
			logToConsole()("Object "+CLASS_NAME+", method getSfdcCountWorkOrders throw exception: [ " + err.message + " ]");
			MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,"ERROR",JobLine.Status,ProcessBar);
			MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,"ERROR",JobLine.Status,ProcessBar);
			alert(SFDC_SYNC_ERROR+'('+JobLine.Name+')');
			JobQueues.JobProcess(Parameters,JobLine);  // check why i can use this
		}
	};
	
	this.CreateMultipleSFDCRecords = function(transformedEntries, sfdcTable, iterationSuccessCallback, iterationErrorCallback, finalCallback)
	{
		//The entries should have at least one of two properties; Fields, which is the JSONObject sent to SFDC
		//The PictureUris property is mostly for incident attachments, but could be used in the future for other things.
		try
		{
			(function(entries, SFDC_TABLE, successCall, errorCall, finishedCallback)
			{
				var i = 0;
				function iterate()
				{
					if(i < entries.length)
					{
						forcetkClient.create(SFDC_TABLE, entries[i].Fields,
							function(callback)
							{
								//Record creation successful!
								if(entries[i].PictureUris !== undefined)
									successCall(callback, entries[i].PictureUris);
								else
									successCall(callback);
								i++;
								iterate();
							},
							function(error)
							{
								//Error creating record!
								//TODO: Would it be better to have the errorCallback after the iterate?
								//In that case all the errors would come after the iteration has finished.
								errorCall(error);
								i++;
								iterate();
							});
					}
					else
					{
						//All done! Iteration complete!
						finishedCallback();
					}
				}
				iterate();
			})(transformedEntries, sfdcTable, iterationSuccessCallback, iterationErrorCallback, finalCallback);
		}
		catch(err)
		{
			storeExternalError(err,{"transformedEntries":transformedEntries,"sfdcTable":sfdcTable});
			alert("There was an error when upserting records!\n" + err);
		}
	};

	this.ConvertFileUriToFileEntries = function(fileUris, callback)
	{
		if(fileUris !== undefined && fileUris.length !== 0)
		{
			(function(items, completedCallback)
			{
				var i = 0;
				var files = [];
				function iterate()
				{
					if(i < items.length)
					{
						window.resolveLocalFileSystemURI(items[i], 
						function(fileEntry){
							fileEntry.file(function(file)
								{
									//Success finding the file, push it to the files array
									files.push(file);
									//Move to the next item
									i++;
									iterate();
								},
								function(err)
								{
									//Error finding the file
									alert("FileEntry.file threw an error: " + err);
									//Move to the next item
									i++;
									iterate();
								});
						},
						function(err)
						{
							//error
							alert("window.resolveFileSystemUri threw an error: " + err);
							//Move to the next Item
							i++;
							iterate();
						});
					}
					else
					{
						//Iteration complete!
						completedCallback(files);
					}
				}
				iterate();
			})(fileUris, callback);
		}
		else
			return undefined;
	};

}

//This is a function to escape special characters
//This extends the String type, and can be called directly on strings like
//var myEscapedString = myString.escapeSpecialChars();
//TODO: move this somewhere else
String.prototype.escapeSpecialChars = function() {
    return this.replace(/\\n/g, "\\\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\&/g, "\\\\\\\\&")
               .replace(/\\r/g, "\\\\r")
               .replace(/\\t/g, "\\\\t")
               .replace(/\\b/g, "\\\\b")
               .replace(/\\f/g, "\\\\f");
			   //there is a bug with the ampersand escape. It escapes it without error, but in the chatter there is an extra backslash
			   //if escapes are removed, the upsert will crash...
};