/*
  @Author: Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 2.6.2015; 
  @Description: Controller for SpareParts page
  @WARNING: 
*/

var SpareParts = new SparePart();

function SparePart()
{
	var RecordId 	= "";
	var Parameters 	= {};
	var PageDiv 	= "spareparts-panel";
	var CLASS_NAME = "SparePart";

	this.SparePartsController = function(parameters)
	{
		try
		{
			Parameters = parameters;
			if(parameters!==undefined)
			{
				RecordId = parameters.ParentId;
				StockInstallationCheck();
			}else{
				alert('undefined parameters for SparePartsController');
			}
		}
		catch(err)
		{
			LOG.handle(err,'Class '+CLASS_NAME+',SparePartsController rise error: '+err.message); 
		}
	};

	function StockInstallationCheck(){
		try{
			var SQLite = SQLTable["SQLITE_STOCK_INSTALLATION"];
			var query = SQLite.SQL + SQLite.WHERE + SQLite.ORDERBY;
			var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : RecordId};
			query = ReplaceSQLParameters(query,replaceParams);
			logToConsole(query);
			var querySpec = sfSmartstore().buildSmartQuerySpec(query, SQLite.LIMIT);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var page = cursor.currentPageOrderedEntries[0];
				var Inst_Cluster = page[1];
				if(Inst_Cluster === "Stock"){
					drawStockInstallationMessage();
				}
				else{
					getSmartStoreData();
				}
			},function(error){LOg.store(error);});
		}catch(err){
			LOG.handle(err,"StockInstallationCheck failed for Installation: ");
		}
	}

	function drawStockInstallationMessage(){
		try{
			$("#spareparts-panel").html('');
			var message = $( '<p>Spare Parts are not displayed for STOCK Installations</p>' );
			$("#spareparts-panel").append(message);
			$("#spareparts-panel").trigger("create");
		}catch(err){
			LOG.handle(err,"Error when drawing 'STOCK' Installation message");
		}
	}

	//Method for get data from SmartStore
	function getSmartStoreData()
	{
		try
		{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : RecordId};
			var WHERE = ReplaceSQLParameters(sWHERE,Params);

			logToConsole()("Spare Part Query:\n[ " + SOUP_SQL+WHERE + " ]");
			
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE, iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) { 
				var page = cursor.currentPageOrderedEntries;
				onSuccessSPDataRetrieve(page);
			});
		} 
		catch(err)
		{
			LOG.handle(err,'Class '+CLASS_NAME+',getSmartStoreData threw error: '+err.message);
		}
	}

	//Martin Opaterny 6/2/2015	
	function onSuccessSPDataRetrieve(response)
	{
		try
		{
			$("#spareparts-panel").html("");
			var table = $('<table class="wartsila-table-a" border="0" cellpadding="0" cellspacing="0" ></table>' );
			$("#spareparts-panel").append(table);
			var thead =$('<thead>'+
							'<tr>'+
							  '<th><p class="no-margin no-padding">Parts Order</p></th>'+
							  '<th><p class="no-margin no-padding">Parts coord.</p></th>'+
							  '<th><p class="align-right no-margin no-padding">Status</p></th>'+
							'</tr>'+
						"</thead>");
			table.append(thead);
			var tbody = $('<tbody></tbody>');
			var Id = "";
			var name = "";
			var coord = "";
			var status = '';
			//Martin Opaterny 6/1/2015
			var Res = SpareParts.parseResponse(response);

			if(Res !== undefined)
			{
				for (var items in Res) 
				{
					if(Res.hasOwnProperty(items)){
						var Main_List = Res[items];
						var detail_line = Main_List.SparePartLine;
						name = Main_List.Name;
						coord = Main_List.Orderer_Name__c;
						status = Main_List.Overall_Delivery_Status__c;
						Id = Main_List.Id;
						// creating special Id's for parent and child rows in the table
						var chiRowId = Id+"_rowIdChild";
						var parRowId = Id+"_rowIdParent";
						var subParRowId = Id+"_sub_rowIdParent"; //substitute parent Id

						var ids = {"parentId":parRowId, "subParentId":subParRowId, "childId":chiRowId, "name":name, "coord":coord, "status":status};
						var obj = JSON.stringify(ids);
						// JC comment not fully understand 
						var newRow = $(
							"<tr id='"+parRowId+"' class='parents' onClick='SpareParts.toggleSubMenu("+obj+")'>" +
								"<td><p class='no-margin no-padding'>" + name + "</p></td>" +
								"<td><p class='no-margin no-padding'>" + coord + "</p></td>" +
								"<td><p class='align-right no-margin no-padding'>" + status + "</p></td>" +
							"</tr>"+
							"<tr class='permHidden' >"+
							"</tr>"+
							"<tr id='"+subParRowId+"' class='substituteParents' onClick='SpareParts.revToggleSubMenu("+obj+")'>" +
								"<td><p class='no-margin no-padding'>" + name + "</p></td>" +
								"<td><p class='no-margin no-padding'>" + coord + "</p></td>" +
								"<td><p class='align-right no-margin no-padding'>" + status + "</p></td>" +
							"</tr>"+
							"<tr class='permHidden'>"+
							"</tr>"
						);

						//added class to the row
						var subRow = $("<tr id='"+chiRowId+"' class='part-detail-table' onClick='SpareParts.revToggleSubMenu("+obj+")'></tr>");
						var empColmun = $("<td colspan=3 class='linesParent'></td>");
						var detailsTable = $('<div class="wartsila-detail-list" ></div>');

						for(var line_items in detail_line)
						{
							if(detail_line.hasOwnProperty(line_items)){
								var Data = detail_line[line_items];
								var inMatDesc = Data.Internal_Material_Description__c;
								var partNum = Data.materialNumber__c;
								var quantity = Data.Quantity__c;
								var numDesc = partNum+" "+inMatDesc; 
								var rowElements = $('<div class="row">' +
														'<div class="label"><p class="no-margin no-padding">' + numDesc + '</p></div>' +
														'<div class="value"><p class="no-margin no-padding">' + quantity + '</p></div> ' +
														'<div class="dotted"></div>' +
													'</div>');
								detailsTable.append(rowElements);
							}
						}

						$(empColmun).append(detailsTable);
						//empColmun.append(listOfElements);
						subRow.append(empColmun);

						tbody.append(newRow);
						tbody.append(subRow);
					}
				}
			}			
			table.append(tbody);
			$("#spareparts-panel").append(table);
			$("#spareparts-panel").trigger( "create" );
		}
		catch(err) {
			alert('Class '+CLASS_NAME+',onSuccessRetrieveOperationDetail rise error: '+err.message); 
		}
	}

	this.parseResponse = function(response){
		var Result = {};
		try
		{
			for (var i = 0; i < response.length; i++) {
				var entry = response[i];
				var order_Id  = entry[0].Id;
				var order_line = Result[order_Id];

				if(order_line===undefined)
				{
					order_line = jQuery.extend(true, {}, SALES_ORDER_LINE);   
					order_line.Id = order_Id;
					order_line.Name = checkFieldValue(entry[0].Name,"string");
					order_line.Orderer_Name__c = checkFieldValue(entry[0].Orderer_Name__c,"string");
					order_line.Overall_Delivery_Status__c = checkFieldValue(entry[0].Overall_Delivery_Status__c,"string");
					order_line.SparePartLine = {};
					Result[order_Id] = order_line;
				}
				var Parts = entry[1]; //Left Join To the Feed Comments
				var Part_Detail = {};
				if((Parts!==undefined) && (Parts!==null) && (Parts!==''))
				{	
					try
					{
						Parts = JSON.parse( Parts );
					}
					catch(e)
					{
						alert('SparePartsController.parseResponse throws error:\n'+e.message); 
					}
				}
				var part_Id = Parts.Id;
				var parts_line = Part_Detail[part_Id];

				if(parts_line===undefined)
				{
					parts_line = jQuery.extend(true, {}, SPARE_PARTS_LINE); 
					parts_line.Id = part_Id; 
					parts_line.Quantity__c = checkFieldValue(Parts.Quantity__c,"integer");
					parts_line.materialNumber__c = checkFieldValue(Parts.codeNumber__c,"string"); //materialNumber__c
					parts_line.Internal_Material_Description__c = checkFieldValue(Parts.materialNumberDescription__c,"string"); //Internal_Material_Description__c
					order_line.SparePartLine[part_Id]=parts_line;
				}
			}
		}
		catch(err)
		{
			alert('Class ,Methods DataTrans_ForSparePartDetail rise error: '+err.message);
			Result = {};
		}
		return Result;
	};

	// modified version to open/close hidden rows. Works according to the given specifications
	this.toggleSubMenu = function(pcRows)
	{
		$('.substituteParents').hide();
		$('.parents').show();
		$('.part-detail-table').hide();
		$('#'+pcRows.parentId).hide();
		$('#'+pcRows.subParentId).show();
		$('#'+pcRows.childId).show();
	};

	this.revToggleSubMenu = function(pcRows)
	{
		$('.part-detail-table').hide();
		$('#'+pcRows.parentId).show();
		$('#'+pcRows.subParentId).hide();
	};

}