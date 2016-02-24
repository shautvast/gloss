package main

import (
	"github.com/julienschmidt/httprouter"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"sync"
)

var lock sync.Mutex
var port = ":8080"

func main() {
	router := httprouter.New()
	router.GET("/dictionary/:dictionaryName", GetDictionary)
	router.GET("/dictionaries", GetDictionaries)
	router.GET("/newDictionary/:dictionaryName", NewDictionary)
	router.GET("/add/:dictionaryName/:key/:value", AddTranslation)
	router.NotFound = http.FileServer(http.Dir("public"))

	print("running on port", port)
	log.Fatal(http.ListenAndServe(port, router))
}

func GetDictionaries(res http.ResponseWriter, req *http.Request, _ httprouter.Params) {
	result := "["
	dirEntries, err := ioutil.ReadDir("data")
	check(err)
	for _, file := range dirEntries {
		if strings.ContainsAny(file.Name(), ".json") {
			filename := file.Name()
			filename = filename[0 : len(filename)-5] //chop off .json
			result += "\"" + filename + "\","
		}
	}
	result = result[0:len(result)-1] + "]"

	res.Header().Set("Content-Type", "application/json")
	res.Write([]byte(result))
}

func GetDictionary(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	dictionary := ps.ByName("dictionaryName")
	dat, err := ioutil.ReadFile("data/" + dictionary + ".json")
	check(err)
	res.Header().Set("Content-Type", "application/json")
	res.Write(dat)
}

func AddTranslation(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	lock.Lock()

	dictionary := ps.ByName("dictionaryName")
	data, err := ioutil.ReadFile("data/" + dictionary + ".json")
	check(err)
	jsonText := string(data)
	addition := ",\n\"" + ps.ByName("key") + "\":\"" + ps.ByName("value") + "\"}"
	jsonText = strings.Replace(jsonText, "}", addition, 1)
	ioutil.WriteFile("data/"+dictionary+".json", []byte(jsonText), 0644)

	lock.Unlock()
}

func NewDictionary(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	dictionary := ps.ByName("dictionaryName")
	jsonText := "{\"\":\"\"\n}"
	ioutil.WriteFile("data/"+dictionary+".json", []byte(jsonText), 0644)
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}
