package com.ibm.mq.samples.java;
import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Hashtable;

public class BasicRequest {

    static class MQDetails {
        String QMGR;
        String HOST;
        int PORT;
        String CHANNEL;
        String APP_USER;
        String APP_PASSWORD;
        String QUEUE_NAME;
        String MODEL_QUEUE_NAME;
        String DYNAMIC_QUEUE_PREFIX;
    }

    static MQDetails mqDetails;

    public static void main(String[] args) {
        loadEnv("env.json");
        sendRequestAndReceiveReply(mqDetails);
        System.out.println("Sample MQ requester application ending");
    }

    private static void loadEnv(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            JSONObject endpoint = new JSONObject(content)
                    .getJSONArray("MQ_ENDPOINTS").getJSONObject(0);

            mqDetails = new MQDetails();
            mqDetails.QMGR = endpoint.getString("QMGR");
            mqDetails.HOST = endpoint.getString("HOST");
            mqDetails.PORT = endpoint.getInt("PORT");
            mqDetails.CHANNEL = endpoint.getString("CHANNEL");
            mqDetails.APP_USER = endpoint.getString("APP_USER");
            mqDetails.APP_PASSWORD = endpoint.getString("APP_PASSWORD");
            mqDetails.QUEUE_NAME = endpoint.getString("QUEUE_NAME");
            mqDetails.MODEL_QUEUE_NAME = endpoint.getString("MODEL_QUEUE_NAME");
            mqDetails.DYNAMIC_QUEUE_PREFIX = endpoint.getString("DYNAMIC_QUEUE_PREFIX");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void sendRequestAndReceiveReply(MQDetails d) {
        MQQueueManager qMgr = null;
        MQQueue requestQueue = null;
        MQQueue replyQueue = null;

        try {
            Hashtable<String, Object> props = new Hashtable<>();
            props.put(MQConstants.HOST_NAME_PROPERTY, d.HOST);
            props.put(MQConstants.PORT_PROPERTY, d.PORT);
            props.put(MQConstants.CHANNEL_PROPERTY, d.CHANNEL);
            props.put(MQConstants.USER_ID_PROPERTY, d.APP_USER);
            props.put(MQConstants.PASSWORD_PROPERTY, d.APP_PASSWORD);
            props.put(MQConstants.TRANSPORT_PROPERTY, MQConstants.TRANSPORT_MQSERIES_CLIENT);

            qMgr = new MQQueueManager(d.QMGR, props);
            System.out.println("Connected to queue manager: " + d.QMGR);

            replyQueue = qMgr.accessQueue(
                d.MODEL_QUEUE_NAME,
                MQConstants.MQOO_INPUT_EXCLUSIVE,
                null,
                d.DYNAMIC_QUEUE_PREFIX,
                null
            );
            String dynamicReplyQueueName = replyQueue.getName();
            System.out.println("Opened dynamic reply-to queue: " + dynamicReplyQueueName);

            requestQueue = qMgr.accessQueue(d.QUEUE_NAME, MQConstants.MQOO_OUTPUT);

            MQMessage request = new MQMessage();
            request.format = MQConstants.MQFMT_STRING;
            request.replyToQueueName = dynamicReplyQueueName;
            request.messageType = MQConstants.MQMT_REQUEST;

            String payload = "{\"Greeting\": \"Hello from Java Requester at " + Instant.now() + "\"}";
            request.writeString(payload);

            MQPutMessageOptions pmo = new MQPutMessageOptions();
            pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

            requestQueue.put(request, pmo);
            System.out.println("Sent request message to queue: " + d.QUEUE_NAME);
            System.out.println("Waiting for reply on: " + dynamicReplyQueueName);

            MQMessage response = new MQMessage();
            MQGetMessageOptions gmo = new MQGetMessageOptions();
            gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT;
            gmo.waitInterval = 10000;

            replyQueue.get(response, gmo);
            String replyText = response.readStringOfByteLength(response.getDataLength());
            System.out.println("Received reply: " + replyText);

        } catch (MQException mqe) {
            System.err.println("MQ Error - Completion Code: " + mqe.completionCode +
                               " Reason Code: " + mqe.reasonCode);
            mqe.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (requestQueue != null) requestQueue.close();
                if (replyQueue != null) replyQueue.close();
                if (qMgr != null) qMgr.disconnect();
            } catch (MQException e) {
                e.printStackTrace();
            }
        }
    }
}
