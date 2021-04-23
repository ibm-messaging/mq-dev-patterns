//
//  ResponseHandler.swift
//  MQSwift
//
//  Created by Soheel Chughtai on 23/04/2021.
//

import Foundation

class ResponseDataHandler {
    func parseDataFile(data: Data) {
        print("In parseDataFile")
        if let jsonDict = parseJSONData(data: data) {
            print("In parseDataFile : all fields passed")
            print("jsonDict is ", jsonDict)
        }
    }
    
    func parseJSONData(data: Data) -> [String: AnyObject]? {
        do {
            let json = try JSONSerialization.jsonObject(
                                with: data,
                                options: .allowFragments) as? [String: AnyObject]
            
            return json
        } catch {
            print(#function, error)
        }
        return nil
    }
}
