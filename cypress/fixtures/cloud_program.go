package main

import (
	"encoding/json"
	"fmt"
	"log"
	"github.take2games.com/2kg-coretech/cloudfuncs-api/cloudprogs"
	"github.take2games.com/2kg-coretech/cloudfuncs-dtlgo/dtlgo"
	"github.take2games.com/2kg-coretech/cloudfuncs-dtlgo/dtlgo/models"
)

// This is your server object
// It can be named whatever you want
// Every cloudprogram endpoint must be a method of this object
// Every method must also start with a capital letter so it's accessible by other go packages
type MyServerObj struct {
}

// Here's an example method DoubleNum which just takes this json object:
// { "Num": 5 }
// and returns a json object:
// { "Doubled": 5 }
func (s *MyServerObj) DoubleNum(req cloudprogs.RequestData, in DoubleNumRequest) (DoubleNumResponse, error) {
	return DoubleNumResponse{
		Doubled: in.Num * 2,
	}, nil
}

// Here are the objects associated with the above method
type DoubleNumRequest struct {
	// Remember a go field must start with a capital letter to be accessible by other packages including for json encoding/decoding
	Num int
}

type DoubleNumResponse struct {
	Doubled int
}

type EmptyObj struct {
}

// Note:
// req RequestData looks like this:
//type RequestData struct {
//	AccountID string <-- This is empty if the caller is another Server and not a game client
//	Claims    *jwt.Claims <-- This contains all the JWT info from the call. See "github.take2games.com/2kg-coretech/dna-common/pkg/jwt"
//	Context   context.Context <-- Use this to pass to clouddata calls, it will contain the deadline information
//}

// Note: Your method signature needs to look like this:
// func (s *<YOUR SERVER OBJECT>) MethodName(anyname cloudprogs.RequestData, anyname <ANY SERIALIZABLE STRUCT>) (<ANY SERIALIZABLE STRUCT>, error)
// Otherwise it will be ignored. There should be log message on cloudprogram start up telling you which methods were correctly registered

// Example INVALID method. This will be ignored!
func (s *MyServerObj) InvalidMethodSignature(req cloudprogs.RequestData) (EmptyObj, error) {
	return EmptyObj{}, nil
}

// Clouddata Game Record example -------------------------------------------------------
// GameRecords aren't dependent on which user is calling cloudprograms

type LuckyNumbers struct {
	Numbers []int
}

func (s *MyServerObj) SetLuckyNumbers(req cloudprogs.RequestData, in LuckyNumbers) (EmptyObj, error) {
	jsonBytes, err := json.Marshal(in)
	if err != nil {
		return EmptyObj{}, fmt.Errorf("failed to marshal lucky number data: %v", err)
	}

	luckyRecord := models.UpdateRecord{
		Opaque: string(jsonBytes),
	}

	// Note: before you can set this you have to create the game record with DTL or with CreateGameRecord
	_, err = dtlgo.CloudData.UpdateGameRecord(req.Context, "@product", "luckynumbers", luckyRecord, nil)
	if err != nil {
		return EmptyObj{}, fmt.Errorf("failed to update game record: %v", err)
	}

	return EmptyObj{}, nil
}

// Here is a global variable which is set in the "main" func
var fairDiceRoll int

func (s *MyServerObj) GetLuckyNumbers(req cloudprogs.RequestData, in EmptyObj) (LuckyNumbers, error) {
	record, err := dtlgo.CloudData.GetGameRecord(req.Context, "@product", "luckynumbers")
	if err != nil {
		// If the record key "luckynumbers" does not exist. The GetGameRecord call will fail
		return LuckyNumbers{}, fmt.Errorf("failed to get luckynumbers game record: %v", err)
	}

	var numbers LuckyNumbers

	err = json.Unmarshal([]byte(record.Opaque), &numbers)
	if err != nil {
		return LuckyNumbers{}, fmt.Errorf("failed to decode luckynumbers: %v", err)
	}

	// This is just to show that you can use global variables in the method
	numbers.Numbers = append(numbers.Numbers, fairDiceRoll)

	return numbers, nil
}

// MAIN --------------
// You need to define a main function that ends with cloudprogs.Listen

func main() {
	// You can do setup here, but the cloudprogram instance is auto-scaled on demand so don't store critical data within the go process
	// Also dtlgo.CloudData won't be valid yet, only being initialized after  dtlgo.CreateDNAContext is run, with InitializeCloudData set to true
	fairDiceRoll = 4

	// Initialize our required subsystems, retrieving required env vars stored in the product's env
	auth, err := cloudprogs.GetAuthConfig()
	if err != nil {
		log.Fatal("Failed to get AuthConfig")
	}

	config := dtlgo.Config{
		InitializeWallet:       true,
		InitializeCloudData:    true,
		InitializeEntitlements: true,
		Auth:                   auth,
	}

	err = dtlgo.CreateDNAContext(config) // create fails if some systems dont exist in discovery
	if err != nil {
		log.Fatal("Failed to CreateDNAContext")
	}

	var s MyServerObj
	log.Fatal(cloudprogs.Listen(&s))
}