/*
  @Author: Juraj Ciljak
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 20.04.2015; 
  @Description: Object for SmartStore Management
  @WARNING: 
*/

var SmartStoreManager = new SmartStoreManagement();

function SmartStoreManagement(){

	this.ExtractDataComments = function(entries){
		try{
			var updateEntry = [];
			if(entries!==undefined){
				for (var i = 0, j = entries.length; i < j; i++){
					var entry = entries[i];
					var Comments = entry.FeedComments;
					if(Comments){
						var records = Comments.records;
						if(records){
							for (var y = 0, z = records.length; y < z; y++) {
								var ent = records[y];
								updateEntry.push(ent);
							}
						}
					}
				}
				if(updateEntry.length>0){
					this.SaveBatchTemplate(updateEntry,SOUP_FEEDCOMMNETS,true);
				}
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"SmartStoreManager - ExtractDataComments","entries":entries});
		}
	};
	
	this.GeneratorID = function(){
		var Result = '';
		try{
			//TODO: This function should be cleaned and commented a lot!
			//Juraj - comment this function generate unique ID for records that are created locally on the device
			// - something like external ID :)
			var u = '', m ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', i = 0, rb = Math.random() * 0xffffffff | 0;
			while(i++<36) {
				var c = m[i-1], r = rb&0xf, v = c == 'x' ? r : (r & 0x3 | 0x8);
				u += (c == '-' || c == '4') ? c : v.toString(16); rb = i % 8 == 0 ? Math.random() * 0xffffffff | 0 : rb >> 4;
			}
			Result = u;
			return Result;
		}
		catch(err){
			storeExternalError(err,{"Where":"SmartStoreManager - GeneratorID"});
		}
	};

	this.SaveDataToSmartStoreJob = function(entry,parameters,jobLine,fieldValue){
		var myParams  = parameters;
		try{
			if((parameters !== undefined) && (entry !== undefined)){
				var SQL_PARAMS = SQLTable[jobLine.SQL];
				var SOUP_TABLE_ORIGIN = SQL_PARAMS.SOUP_TABLE;
				var origin = entry;
				sfSmartstore().upsertSoupEntries(SOUP_TABLE_ORIGIN, origin,
					function(success) {
						JobQueues.JobProcess(myParams,jobLine); 
					},
					function(error){
						storeExternalError(error,{"Where":"SmartStoreManager - SaveDataToSmartStoreJob - upsertSoupEntries","SOUP_TABLE_ORIGIN":SOUP_TABLE_ORIGIN,"origin":origin});
						jobLine.Status = VALUE_ERROR_UPSERT;
						JobQueues.JobProcess(myParams,jobLine); 
					}
				);
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"SmartStoreManager - SaveDataToSmartStoreJob","entry":entry,"parameters":parameters,"jobLine":jobLine,"fieldValue":fieldValue});
			myParams.Status = VALUE_ERROR_UPSERT;
			JobQueues.JobProcess(myParams, jobLine); 
		}
	};

	//This function saves data to SmartStore. It requires a few parameters:
	//entry: the response gotten from forcetkClient.query
	//parameters: a JSON object (defined most likely in NavigationManager), where the JobName is got from
	//jobline: 
	//fieldValue: not used
	this.SaveDataToSmartStoreJobProcess = function(entry, parameters, jobLine, fieldValue){
		var myParams  = parameters;
		var BatchAttchIDs = [];
		var BatchFeedIDs = [];
		var entries = [];
		var AttItem;
		var clearTable = true;
		try{
			var clTable = JobQueues.getClearTable(); 
			var SQL_PARAMETERS = SQLTable[jobLine.SQL];
			//Go through each of the records if entry is defined
			$.each(entry.records, function(i, SFDCdata){
				var record = SFDCdata;//nullToString(SFDCdata)
				if((record !== undefined) && (record !== null)){
				//push each of the records to the newly defined entries array.
					entries.push(record);
				}
				// should be one custom function
				if(jobLine.Attachement == VALUE_YES){
					AttItem = jQuery.extend(true, {}, BATCH_ATTACHEMENT); // Attachment
					AttItem.Id = SFDCdata.Id; 
					AttItem.ParentId = SFDCdata.Id;
					AttItem.isDownloaded = VALUE_NO;
					BatchAttchIDs.push(AttItem);
				}
				if(jobLine.Feed == VALUE_YES){
					var feedItem = jQuery.extend(true, {}, BATCH_FEED); // Feed Id
					feedItem.Id=SFDCdata.Id; 
					feedItem.ParentId = SFDCdata.Id;
					feedItem.isDownloaded = VALUE_NO; 
					feedItem.ObjectType = SQL_PARAMETERS.TABLE;
					BatchFeedIDs.push(feedItem);
				}
			});
			//If there were entries, do the following. Also the parameters and the response need to be defined
			if((entries !== undefined) && (entries.length > 0) && (parameters !== undefined) && (entry !== undefined)){
				var SQL_PARAMS = SQLTable[jobLine.SQL];
				var SOUP_TABLE_ORIGIN = SQL_PARAMS.SOUP_TABLE;
				switch (jobLine.Name){
					case FETCH_ATTACHEMENT_HEAD :
						clearTable = clTable.Attachement.ClearTable;
						clTable.Attachement.ClearTable = false;
						JobQueues.updateClearTable(clTable);
						break;
					case FETCH_CURRENT_USER:
					case FETCH_USERS :
						clearTable = clTable.Users.ClearTable;
						clTable.Users.ClearTable = false;
						JobQueues.updateClearTable(clTable);
						break;
					default:
						clearTable = jobLine.OffSet.ClearTable;
						break;
				}
				if(clearTable === true){
					sfSmartstore().clearSoup(SOUP_TABLE_ORIGIN, onSuccessClearSoup, onErrorClearSoup);//Change delete
				}
				var origin = entries;//Batchs.setEntriesFieldValue(entry,"isDownloaded",fieldValue);
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_TABLE_ORIGIN, origin,'Id',
					function(success){
						//Upserting the entries succeeded! 
						//Run javaScript method which is defined in jobLine
						MethodsRunner.ProccessMethodsJob(jobLine); 
						if(BatchAttchIDs.length > 0){
							//clear before fetching
							SmartStoreManager.SaveBatchTemplate(BatchAttchIDs, SOUP_BATCH_TEMP_ATTACHEMENT_TABLE, false, undefined);
							clTable.Attachement.ClearTable = false;
							JobQueues.updateClearTable(clTable);
						}
						if(BatchFeedIDs.length > 0){
							//clear before fetching
							SmartStoreManager.SaveBatchTemplate(BatchFeedIDs, SOUP_BATCH_TEMP_TABLE, false, undefined);
						}
						//Start job recursion
						JobQueues.JobProcess(myParams, jobLine);
					},
					function(error)	{
						//Upserting the entries failed!
						storeExternalError(error,{"Where":"SmartStoreManager - SaveDataToSmartStoreJobProcess - upsertSoupEntriesWithExternalId","SOUP_TABLE_ORIGIN":SOUP_TABLE_ORIGIN,"origin":origin});
						jobLine.Status = VALUE_ERROR_UPSERT;
						//Start job recursion
						JobQueues.JobProcess(myParams, jobLine);
					}
				);
			}
			else{
				//Start job recursion
				JobQueues.JobProcess(myParams, jobLine);
			}
		}
		catch(err){
			storeExternalError(err,{"Where":"SmartStoreManager - SaveDataToSmartStoreJobProcess","entry":entry,"parameters":parameters,"jobLine":jobLine,"fieldValue":fieldValue});
			myParams.Status = VALUE_ERROR_UPSERT;
			JobQueues.JobProcess(myParams,jobLine);
		}
	};
	
	this.SaveBatchTemplate = function(entry,soup_table,clear,Parameters){
		try{
			if(clear === true){
				sfSmartstore().clearSoup(soup_table, onSuccessClearSoup, onErrorClearSoup);//Change delete
			}
			sfSmartstore().upsertSoupEntriesWithExternalId(soup_table, entry, "Id",
				function(items){
					if(Parameters !== undefined){
						MethodsRunner.ProccessMethods(Parameters);
					}
				},
				function(error)	{
					storeExternalError(error,{"Where":"SmartStoreManager - SaveBatchTemplate - upsertSoupEntriesWithExternalId","entry":entry,"soup_table":soup_table,"clear":clear,"Parameters":Parameters});
				}
			);
		}
		catch(err){
			storeExternalError(err,{"Where":"SmartStoreManager - SaveBatchTemplate","entry":entry,"soup_table":soup_table,"clear":clear,"Parameters":Parameters});
		}
	};
}