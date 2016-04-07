/*
  @Author: Kimmo Hovi, 
  @email: kimmo.j.hovi@accenture.com, 
  @Version: 1.0
  @LastModified: 17.06.2015; 
  @Description: Controller for the RiskAssessment page

*/

function WorkSafety()
{
	var CLASS_NAME = "WorkSafety";
	var Data = { "JSAActivities" : []}

	this.WorkSafetyController = function(serviceOrderId)
	{
		try
		{
			//TODO: Name recordId in a better way. recordId is a bit ambiguous
			if(serviceOrderId !== undefined)
			{
				//@ToDo: fetch data from SF dynamically
				this.GetSmartStoreData(serviceOrderId);
			}
		}
		catch(err)
		{
			alert("Object " + CLASS_NAME + ", method WorkSafetyController threw an error: " + err.message);
		}
	};
	
	this.GetSmartStoreData = function(ServiceOrderId)
	{
		try
		{
			$( '#work-safety-panel' ).html('');
			var loading = $( '<p>Loading...</p>' );
			$( '#work-safety-panel' ).append(loading);
			var SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : ServiceOrderId};
			WorkSafety.getSmartStoreData("SQLITE_JSA_ACTIVITIES", SmartStoreQueryParams, 
				function(result)
				{
					//Render the data
					Data.JSAActivities = result;
					WorkSafety.renderHTML();
				}, 
				function(err)
				{
					logToConsole()('onSuccessWorkSafetyDataRetrieve Error: [ ' + err.message + ' ]');
					alert('onSuccessWorkSafetyDataRetrieve error: ' + err.message);
				});
		}
		catch(err)
		{
			alert("WorkSafetyController error: " + err.message);
		}	
	};
	
	this.renderHTML = function()
	{
		try
		{
			//Find the right panel
			$("#work-safety-panel").html("");
			//Create a table and a body for that table
			var table = $('<table class="wartsila-table-a" border="0" cellpadding="0" cellspacing="0" ></table>' );			
			var tbody = $("<tbody></tbody>");
			var hasItems = false;
			var approvableItems = false;
			//Create a new row for each of the items in the response
			//The HTML structure for a row is defined here!
			$.each(Data.JSAActivities, function(i, SFDCdata) {
				//each item is an array with a single item! Hence the braces.
				var record = SFDCdata;
				if ( record !== undefined && record !== null ) {
					//Decide on the color of the row based on approved/not approved
					var color = 'green';
					if(record.Approved__c === false)
					{
						color = 'red';
						approvableItems = true;
					}
					var images = "";
					if(record.RA_Activity__r.PPEs__c !== null)
					{
						var PPEs = record.RA_Activity__r.PPEs__c.split(";");
						for(var i = 0; i < PPEs.length; i++)
						{
							var file = "";
							switch(PPEs[i].toLowerCase())
							{
								case "safety shoes":
									file = "images/icons/ppe/wear_safety_shoes.png";
									break;
								case "ear protection":
									file = "images/icons/ppe/wear_ear_protection.png";
									break;
								case "welding mask":
									file = "images/icons/ppe/wear_welding_mask.png";
									break;
								case "face shield":
									file = "images/icons/ppe/wear_face_protection.png";
									break;
								case "fall arrest":
									file = "images/icons/ppe/wear_safety_harness.png";
									break;
								case "gas detector":
									file = "images/icons/ppe/gas_detector.png";
									break;
								case "gloves":
									file = "images/icons/ppe/wear_gloves.png";
									break;
								case "hi-vis overalls / bibs":
									file = "images/icons/ppe/wear_hivis.png";
									break;
								case "mv / hv ppe":
									file = "images/icons/ppe/wear_MV_HV_ppe.png";
									break;
								case "safety glasses":
									file = "images/icons/ppe/wear_eye_protection.png";
									break;
								case "safety helmet":
									file = "images/icons/ppe/wear_helmet.png";
									break;
								case "work wear":
									file = "images/icons/ppe/wear_workclothes.png";
									break;
								case "safety belt":
									file = "images/icons/ppe/safety_belt.png";
									break;
								case "life jacket":
									file = "images/icons/ppe/wear_lifejacket.png";
									break;
								default:
									break;
							}
							if(file !== "")
							{
								images += '<img src="' + file + '" style="height: 64px; width: auto;" class="float-right"/>';
							}
						}
					}
					
					var tools = record.RA_Activity__r.Tools__c;
					var permits = record.RA_Activity__r.Permits__c;
					var precaution = record.RA_Activity__r.Precaution_notes__c;
					
					if(tools !== null && tools !== undefined)
						tools = tools.replace(/;/g, ", ");
					else
						tools = "No special tools needed.";
					
					if(permits !== null && permits !== undefined)
						permits = permits.replace(/;/g, ", ");
					else
						permits = "No special permits needed.";
					
					if(precaution === null || precaution === undefined)
						precaution = "Nothing special to be aware of!";
					
					var newRow = $(
						'<tr onclick="WorkSafety.WorkSafetyPopUp(\'' + record.Id + '\')"><td>' +
							'<div class="row">' +
								'<div class="label"><h3 class="date-head no-margin no-padding">' + record.RA_Activity__r.Short_Activity_Title__c + '</h3></div>' +
								//'<div class="wartsila-traffic-light ' + color + '">' +
								//'<p class="float-right"><b>' + record.Count_of_Injuries__c + '/' + record.Count_of_Near_Misses__c + '</b></p>' +
								//'</div>' +
								'<div class="clear-both"></div>'+
							'</div>'+
							
							'<div class="row">' +
								'<p><b>Activity injuries/near misses: </b>' + record.Count_of_Injuries__c + '/' + record.Count_of_Near_Misses__c + '</p>' +
							'</div>' +
							
							'<div class="row">' +
								'<p><b>Special tools: </b>' + tools + '</p>' +
							'</div>' +
							'<div class="row">' +
								'<p><b>Permits & Certificates: </b>' + permits + '</p>' +
							'</div>' +
							/*'<div class="row">' +
								'<div class="label"><p class="no-margin no-padding">Risk level</p></div>' +
								'<div class="value"><p id="Test" class="no-margin no-padding">risklevel1</p></div>' +								
								'<div class="dotted"></div>' +
							'</div>' +*/
							'<div class="row">' +
								'<p><b>Precaution notes: </b>' + precaution + '</p>' +
							'</div>' +
							'<div class="row">' +
								images +
								'<div class="clear-both"></div>'+
							'</div>' +
						'</td></tr>'
					);
					tbody.append(newRow);
					hasItems = true;
				}
			});		
			if(hasItems)
			{
				var disableCheckboxes = "";
				if(approvableItems === false)
				{
					disableCheckboxes = 'disabled="true" checked="true" ';
				}
				var approvestring1 = "I have been assigned as team responsible for this work. I have the authority to STOP the work in" +
					" case our EHS requirements are not fulfilled and the power to take immediate actions that could involve direct costs for" + 
					" Wartsila in accordance with applicable Wartsila spending directives and Customer responsibilities.";
				var approvestring2 = "I have read, understood and consequently assessed at site that all the safety requirements stated " +
					"by the applicable law were fulfilled. All have been communicated to the team.";
				var approveRow = '<tr><td>' +
					'<div class="row">' +
						'<p><input type="checkbox" ' + disableCheckboxes + '"name="checkbox-0" id="approved-one" class="custom" data-mini="false" onchange="WorkSafety.ApproveChanged();"/> ' + 
						approvestring1 + '</p>' +
						'<p><input type="checkbox" ' + disableCheckboxes + '"name="checkbox-1" id="approved-two" class="custom" data-mini="false" onchange="WorkSafety.ApproveChanged();"/> ' +
							approvestring2 + '</p>' +
					'</div>' +
					
					"<div id='approveButton' class='wartsila-btn ui-disabled' onclick='WorkSafety.Approve();'>Approve safety rules</div>" +
				'</td></tr>';
				tbody.append(approveRow);
			}
			
			table.append(tbody);
			if(hasItems)
			{
				$("#work-safety-panel").append(table);
			}
			else
			{
				//If no items exist, then display that to the user.
				var noItems = $('<p>No activities</p>');
				$( '#work-safety-panel' ).append(noItems);
			}
		}
		catch(err)
		{
			logToConsole()('WorkSafetyRenderHTML Error: [ ' + err.message + ' ]');
			alert('WorkSafetyRenderHTML: ' + err.message);
		}
	};
	
	
	this.ApproveChanged = function() 
	{
		var button = $("#approveButton");
		var approved1 = $("#approved-one").is(':checked');
		var approved2 = $("#approved-two").is(':checked');
		if(approved1 === true && approved2 === true)
		{
			//Do stuff
			button.removeClass('ui-disabled');
			button.addClass('orange');
			button.disabled = true;
		}
		else
		{
			button.removeClass('orange');
			button.addClass('ui-disabled');
			button.disabled = true;
		}
	};
	
	this.WorkSafetyPopUp = function(activityId)
	{
		try
		{
			var result = $.grep(Data.JSAActivities, function(e){ return e.Id == activityId; });
			var activity = result[0];
			
			var tools = activity.RA_Activity__r.Tools__c;
			if(tools !== null && tools !== undefined)
				tools = tools.replace(/;/g, ", ");
			else
				tools = "No special tools needed.";
			
			var hazards = activity.RA_Activity__r.Hazards__c;
			if(hazards !== null && hazards !== undefined)
				hazards = hazards.replace(/;/g, ", ");
			else
				hazards = "No special hazards.";
			
			var ppe = activity.RA_Activity__r.PPEs__c;
			if(ppe !== null && ppe !== undefined)
				ppe = ppe.replace(/;/g, ", ");
			else
				ppe = "No special protective equipment needed.";
			
			var permits = activity.RA_Activity__r.Permits__c;
			if(permits !== null && permits !== undefined)
				permits = permits.replace(/;/g, ", ");
			else
				permits = "No special permits needed.";
			
			var precaution = activity.RA_Activity__r.Precaution_notes__c;
			if(precaution === null || precaution === undefined)
				precaution = "Nothing special to be aware of!";
			
			var content = '<a href="#" id="closePopup" data-rel="back"  data-theme="a" data-iconpos="notext" class="ui-btn-right">' +
							'<img src="images/icons/close-button-32.png" />' +
						"</a>" +
						"<h2>" + activity.RA_Activity__r.Short_Activity_Title__c + "</h2>" +
						"<h4>Hazards</h4>" +
						"<p>" + hazards + "</p>" +						
						"<h4>Hazard descriptions</h4>" +
						"<p>" + activity.RA_Activity__r.Hazard_Descriptions1__c + " " + activity.RA_Activity__r.Hazard_Descriptions2__c + "</p>" +
						"<h4>Tools</h4>" +
						"<p>" + tools + "</p>" +
						"<h4>PPEs</h4>" +
						"<p>" + ppe + "</p>" +
						"<h4>Permits and procedures</h4>" +
						"<p>" + permits + "</p>" +
						"<h4>Precaution notes</h4>" +
						"<p>" + precaution + "</p>";
			$("#safety-popup").empty();
			$("#safety-popup").append(content);
			$("#safety-popup").trigger( "create" );
			$("#safety-popup").popup("open");
		}
  		catch(err)
  		{ 
			alert('Class '+CLASS_NAME+',RAPopUp threw an error: '+err.message);	
  		}
	};

	//A function that gets the data needed from smartstore. This is probably quite generic.
	//@param SQLitenQueryName is the name of the SQLite query in SQLTable (defined in database.js)
	//@param SmartStoreQueryParams are the parameters for the SQLite query e.g { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : serviceOrderId};
	//@param successCallback is the function called upon successful query
	//@param failCallback is the function called upon failure
	this.getSmartStoreData = function(SQLiteQueryName, SmartStoreQueryParams, successCallback, failCallback)
	{
		try
		{
			var SQL_PARAMS = SQLTable[SQLiteQueryName];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE; 
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var SOUP_SQL = SQL_PARAMS.SQL;
			var WHERE = ReplaceSQLParameters(sWHERE, SmartStoreQueryParams);
				
			var QuerySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL + WHERE + sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(QuerySpec, 
				function(result)
				{
					//The records from SmartStore are delivered as an array of arrays containing a single object.
					//The following few lines modify the result to have the same form as forcetkClients results.
					//This to make it possible to also deliver results straight from forcetkClient without using SmartStore (when online)
					var records = [];
					$.each(result.currentPageOrderedEntries, function(i, SmartStoreData)
					{
						records.push(SmartStoreData[0]);
					});
					successCallback(records);
				}, 
				function(err)
				{
					failCallback(err);
				});
		}
		catch(err)
		{
			alert("WorkSafetyController threw an error in getSmartStoreData: " + err.message);
			failCallback(err);
		}
	};

	this.Approve = function()
	{
		var approved1 = $("#approved-one").is(':checked');
		var approved2 = $("#approved-two").is(':checked');
		var button = $("#approveButton");
		if(approved1 === true && approved2 === true)
		{
			var updated = [];
			$.each(Data.JSAActivities, function(i, activity) {
				if(activity.Approved__c === false)
				{
					activity.Approved__c = true;
					activity.SaveStatus = VALUE_UPDATED;
					updated.push(activity);
				}
			});
			sfSmartstore().upsertSoupEntries(SOUP_JSA_ACTIVITIES_TABLE, updated,
				function(success) 
				{
					window.scrollTo(0, 0);
					WorkSafety.renderHTML();
				},
				function(error)	{
					alert("error: " + error); 
				}
			);
		}
	};
}

var WorkSafety = new WorkSafety();