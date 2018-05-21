var app = angular.module("app", ['ngPatternRestrict', 'pubnub.angular.service', 'angularTreeview', 'ui.bootstrap', 'ngDrag']); 
app.controller("myCtrl", function($scope, $http, $window, $timeout) {
	$scope.error = false;
	$scope.showContent = false;
	$scope.showIds = false;
	$scope.labels = false;
	$scope.header = "header";
	
	// Clearing Local Storage on Page Reload or Refresh //
	window.onload = function(){
		console.log(localStorage.AppIds);
		var reloadArray = localStorage.AppIds.split(',');
		console.log(reloadArray);
		$scope.idArray = [];
		for(i=0; i<reloadArray.length; i++){
			var obj = {};
			obj.id = reloadArray[i];
			if(i==0){
				obj.classValue = 'active';
			}
			else{
				obj.classValue = '';
			}
			$scope.idArray.push(obj);
		}
		console.log($scope.idArray);
		publicationDetailsAPICall($scope.idArray[0].id);
	}
	
	// Searching Application Ids By A String //
	$scope.getSearch = function(searchStr){
		console.log(searchStr);
		return $http.get("http://rainiersoft.com/clients/publishbook/rest/publish/GetIds?application="+searchStr).then(function(resp){
			console.log(resp.data.responseData);
			var item = [];
			if(resp.data.responseData != null){
				$scope.error = false;
				for(i=0; i<resp.data.responseData.length; i++){
					item.push(resp.data.responseData[i].Publication_Number);
				}
				console.log(item);
				return item;
			}
			else{
				$scope.errorMessage = "Oops...!!! No results found.";
				$scope.error = true;
				$timeout(function() {
					$scope.error = false;
				}, 5000);
			}
		});
	};
	
	// Selecting An Application Id From Search Results //
	$scope.onSearchSelect = function(searchParam){
		if(localStorage.length == 0){
			localStorage.setItem("AppIds", searchParam);
			$scope.idArray = [];
			var obj = {};
			obj.id = searchParam;
			$scope.idArray.push(obj);
			for(i=0; i<$scope.idArray.length; i++){
				if(i==0){
					$scope.idArray[0].classValue = 'active';
				}
			}
		}
		else{
			var result = _.findWhere($scope.idArray, {id: searchParam});
			console.log(result);
			if(result == undefined){
				localStorage.setItem('AppIds', searchParam+','+localStorage.AppIds);
				console.log(localStorage.AppIds);
				var obj = {};
				obj.id = searchParam;
				obj.classValue = 'active';
				for(m=0;m<$scope.idArray.length;m++){
					delete $scope.idArray[m].classValue;
					console.log($scope.idArray);
				}
				$scope.idArray.unshift(obj);
				console.log($scope.idArray);
			}
		}
		console.log(localStorage);
		console.log($scope.idArray);
		$scope.showContent = false;
		$scope.noDetails = false;
		// Common Method for API Call to see the Publication Details
		publicationDetailsAPICall(searchParam);
    }
	
	// Drap n Drop of an App Id //
	$scope.onDropComplete1=function(data,evt){
		var result = _.findWhere($scope.idArray, {id: data.Publication_Number});
		console.log(result);
		if(result == undefined){
			var obj = {};
			obj.id = data.Publication_Number;
			obj.classValue = 'active';
			console.log($scope.idArray);
			for(m=0; m<$scope.idArray.length; m++){
				delete $scope.idArray[m].classValue;
			}
			$scope.idArray.unshift(obj);
			localStorage.setItem('AppIds', data.Publication_Number+','+localStorage.AppIds);
			console.log($scope.idArray);
			// Common Method for API Call to see the Publication Details
			publicationDetailsAPICall(data.Publication_Number);
		}
		else{
			alert('Application Id ' +data.Publication_Number +' already exists...');
		}
	}
	
	// Single or Multiple Publication Details Method //	
	$scope.getSearchResults = function(searchParam){
		var splitArray = searchParam.split(',');
		console.log(splitArray);
		if(localStorage.length == 0){
			localStorage.setItem("AppIds", searchParam);
			$scope.idArray = [];
			for(i=0; i<splitArray.length; i++){
				var obj={};
				obj.id = splitArray[i];
				if(i==0){obj.classValue = 'active';}
				else{obj.classValue = '';}
				$scope.idArray.push(obj);
			}
		}
		else{
			localStorage.setItem('AppIds', searchParam+','+localStorage.AppIds);
			$scope.idArray = [];
			var array = localStorage.AppIds.split(',');
			console.log(array);
			for(m=0;m<array.length; m++){
				var obj={};
				obj.id = array[m];
				if(m==0){obj.classValue='active';}
				else{obj.classValue='';}
				$scope.idArray.push(obj);
			}
			console.log($scope.idArray);
		}
		publicationDetailsAPICall($scope.idArray[0].id);
	};
	
	// Tab Wise Publication Details //
	$scope.getIdDetails = function(searchParam){
		$window.scrollTo(0,0);
		// Common Method Invoking When An Application Id is Clicked
		publicationDetailsAPICall(searchParam);
	}
	
	// Method to get the Publication Details by Using Voice Speech //
	$scope.dictateIt = function(){
		$scope.searchParam = "";
		var recognition = new webkitSpeechRecognition();
		recognition.onresult = function (event) {
			$scope.$apply(function() {
				for (var i = event.resultIndex; i < event.results.length; i++) {
					if (event.results[i].isFinal) {
						$scope.searchParam  += event.results[i][0].transcript;
					}
				}
				$scope.searchParam = $scope.searchParam.replace(/ /g, "");
			});
			$http.get("http://rainiersoft.com/clients/publishbook/rest/publish/Get?number="+$scope.searchParam).then(function(resp){
				console.log(resp);
				if(resp.data.status == "Failed"){
					$scope.searchParam = "";
					$scope.searchData = {};
					$scope.errorMessage = "Oops! this application id does not exists";
					$scope.error = true;
					$scope.showContent = false;
					$scope.header = "header";
				}
				else{
					$scope.error = false;
					$scope.showContent = true;
					$scope.searchData = resp.data;
					$scope.header = "header1";
				}
			});
		};
		recognition.start();
	};
	
	$scope.removeAppId = function(obj,id){
		var result = confirm("Are you sure to remove App Id?");
		console.log(obj, id);
		if(result){
			$scope.idArray = $scope.idArray.filter(function(obj){
				return obj.id !== id;
			});
			var splitArray = localStorage.AppIds.split(',');
			var index = splitArray.indexOf(id);
			if(index > -1){
				splitArray.splice(index, 1);
			}
			localStorage.AppIds = splitArray.toString();
			console.log($scope.idArray);
			if($scope.idArray.length>0){
				for(i=0; i<$scope.idArray.length; i++){
					delete $scope.idArray[i].classValue;
				}
				$scope.idArray[0].classValue = 'active';
				console.log($scope.idArray);
				publicationDetailsAPICall($scope.idArray[0].id);
			}
			else{
				$scope.error = false;
				$scope.showContent = false;
				$scope.showIds = false;
				$scope.labels = false;
				$scope.header = "header";
				localStorage.clear();
			}
		}
	};
	
	// Common Method Calling //
	function publicationDetailsAPICall(searchParam){
		console.log(searchParam);
		$http.get("http://rainiersoft.com/clients/publishbook/rest/publish/Get?number="+searchParam).then(function(resp){
			console.log(resp.data);
			$scope.showIds = true;
			$scope.labels = true;
			$scope.header = "header1";
			$scope.searchParam = "";
			if(resp.data.status == "Failed" || resp.data == ""){
				$scope.searchData = {};
				$scope.errorMessage = "Oops! this application id does not exists";
				$scope.noDetails = true;
				$scope.showContent = false;
				$scope.message = resp.data.message;
				// Sometime API returning Empty Response Date //				
				if(resp.data == ""){
					$scope.message = 'No Publication Details Found';
				}
				$scope.header = "header1";
			}
			else{
				$scope.error = false;
				$scope.showContent = true;
				$scope.noDetails = false;
				$scope.searchData = resp.data;
				$scope.searchData.classification = [];
				$scope.header = "header1";
				var Classifications = resp.data.All_US_Classifications.split('|');
				var All_IP_Classifications = resp.data.All_IP_Classifications.split('|');
				$scope.searchData.All_US_Classifications = Classifications.join(", ");
				$scope.searchData.All_IP_Classifications = All_IP_Classifications.join(", ");
				var string = Classifications[Classifications.length-1];
				var res = string.substring(0, 4);
				$http.get("http://rainiersoft.com/clients/publishbook/rest/publish/GetIds?application="+res).then(function(resp){
					console.log(resp.data.responseData);
					if(resp.data.responseData != null){
						if(resp.data.responseData.length<=12){
							n = resp.data.responseData.length;
						}
						else{ n = 11; }
						for(a=0; a<n; a++){
							$scope.searchData.classification.push(resp.data.responseData[a]);
						}
					}
					else{
						$scope.searchData.classification = 'null';
					}
				});
			}
		});
	}
});

// Library file to produce Bubble Tree View //
(function(l){l.module("angularTreeview",[]).directive("treeModel",function($compile){return{restrict:"A",link:function(a,g,c){var e=c.treeModel,h=c.nodeLabel||"label",d=c.nodeChildren||"children",k='<ul><li data-ng-repeat="node in '+e+'"><i class="collapsed" data-ng-show="node.'+d+'.length && node.collapsed" data-ng-click="selectNodeHead(node, $event)"></i><i class="expanded" data-ng-show="node.'+d+'.length && !node.collapsed" data-ng-click="selectNodeHead(node, $event)"></i><i class="normal" data-ng-hide="node.'+
d+'.length"></i> <span data-ng-class="node.selected" data-ng-click="selectNodeLabel(node, $event)">{{node.'+h+'}}</span><div data-ng-hide="node.collapsed" data-tree-model="node.'+d+'" data-node-id='+(c.nodeId||"id")+" data-node-label="+h+" data-node-children="+d+"></div></li></ul>";e&&e.length&&(c.angularTreeview?(a.$watch(e,function(m,b){g.empty().html($compile(k)(a))},!1),a.selectNodeHead=a.selectNodeHead||function(a,b){b.stopPropagation&&b.stopPropagation();b.preventDefault&&b.preventDefault();b.cancelBubble=
!0;b.returnValue=!1;a.collapsed=!a.collapsed},a.selectNodeLabel=a.selectNodeLabel||function(c,b){b.stopPropagation&&b.stopPropagation();b.preventDefault&&b.preventDefault();b.cancelBubble=!0;b.returnValue=!1;a.currentNode&&a.currentNode.selected&&(a.currentNode.selected=void 0);c.selected="selected";a.currentNode=c}):g.html($compile(k)(a)))}}})})(angular);