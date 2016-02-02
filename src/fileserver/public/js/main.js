angular.module("Gloss", [])

.controller('TranslateCtrl', function($scope, $http) {
    reloadDictionaries();
    focus("#searchInput");
    
    //select text in input elements when focus gained
    $(function () {
            var focusedElement;
            $(document).on('focus', 'input', function () {
                if (focusedElement == $(this)) return; //already focused, return so user can now place cursor at specific point in input.
                focusedElement = $(this);
                setTimeout(function () { focusedElement.select(); }, 50); //select all text in any field on focus for easy re-entry. Delay sightly to allow focus to "stick" before selecting.
            });
    });

    //focusses the element after a short interval
    function focus(element){
        setTimeout(function(){ $(element).focus(); }, 200); 
    }

    //simple DIY routing
    setInterval(function(){
        var savedHash;
        if (document.location.hash != savedHash){
           if(document.location.hash != '#adding'){
                $scope.adding = false;
                $scope.$digest();
                focus('#newKeyInput');
            } else {
                $scope.adding = true;
                $scope.$digest();
                focus("#searchInput");
            }
            savedHash = document.location.hash;
        }
    },100);

    //find all matches for a given search key (all keys beginning with the text typed)
    $scope.translate = function(){
        output=[];
        if ($scope.input && $scope.input != ''){
            for (var i=0; i<$scope.keys.length; i++){
                if (stringStartsWith($scope.keys[i], $scope.input)) {
                    output.push({dutch: $scope.keys[i], english: $scope.dictionary[$scope.keys[i]]});
                }
            }
            $scope.translation = output;
        } else {
            $scope.translation = null;
        }
    } 

    $scope.chooseDictionary = function(element){
        $scope.currentDictionary = element.dictionary;
        reloadDictionary();
        $scope.translation=[];
        focus("#searchInput");
    }

    //uploads a new translation to the server
    $scope.addTranslation = function(){
        if ($scope.newDutchWord){
            $http.get('/add/' + $scope.currentDictionary + '/' + $scope.newDutchWord + '/' + $scope.newEnglishWord);
        }
        $scope.adding = false;
        document.location.hash = '';
        setTimeout(reloadDictionary, 200); //as it turns out doing this immediately returns the old version
    }

    /* startsWith function, ignores case*/
    function stringStartsWith(string, prefix) {
        return string.slice(0, prefix.length).toLowerCase() == prefix.toLowerCase();
    }

    //retrieves the dictionary from the server
    function reloadDictionaries(){
        $http.get('dictionaries').success(function(data) {
            $scope.dictionaries=data;
            if (!$scope.currentDictionary) {
                $scope.currentDictionary = data[0];
            }
            reloadDictionary();    
        });
    }

    function reloadDictionary(){
        $http.get('dictionary/'+$scope.currentDictionary).success(function(data) {
                $scope.dictionary = data;
                $scope.keys=Object.keys(data);
        });
    }

    $scope.newDictionary=function(){
        $http.get('newDictionary/' + $scope.dictionaryName);
        $scope.currentDictionary=$scope.dictionaryName;
        reloadDictionaries();

        $scope.dictionaryName='';
    }        
});