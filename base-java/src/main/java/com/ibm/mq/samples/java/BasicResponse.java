package com.ibm.mq.samples.java;
import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;

public class BasicResponse {

    static class MQDetails {
        String QMGR;
        String HOST;
        int PORT;
        String CHANNEL;
        String APP_USER;
        String APP_PASSWORD;
        String QUEUE_NAME;
    }

    static MQDetails mqDetails;

    public static void main(String[] args) {
        loadEnv("env.json");
        listenAndRespond(mqDetails);
        System.out.println("Sample MQ responder application ending");
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
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void listenAndRespond(MQDetails d) {
        MQQueueManager qMgr = null;
        MQQueue requestQueue = null;

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

            requestQueue = qMgr.accessQueue(
                d.QUEUE_NAME,
                MQConstants.MQOO_INPUT_AS_Q_DEF | MQConstants.MQOO_OUTPUT
            );

            MQGetMessageOptions gmo = new MQGetMessageOptions();
            gmo.options = MQConstants.MQGMO_WAIT | MQConstants.MQGMO_CONVERT;
            gmo.waitInterval = 10000;

            while (true) {
                MQMessage request = new MQMessage();
                try {
                    requestQueue.get(request, gmo);
                    String msgText = request.readStringOfByteLength(request.getDataLength());
                    System.out.println("Received request: " + msgText);

                    String replyToQueueName = request.replyToQueueName;
                    if (replyToQueueName != null && !replyToQueueName.isEmpty()) {
                        MQQueue replyQueue = qMgr.accessQueue(replyToQueueName, MQConstants.MQOO_OUTPUT);

                        MQMessage reply = new MQMessage();
                        reply.format = MQConstants.MQFMT_STRING;
                        reply.correlationId = request.messageId;

                        JSONObject replyJson = new JSONObject();
                        replyJson.put("Response", "Hello from Java Responder!");
                        reply.writeString(replyJson.toString());

                        MQPutMessageOptions pmo = new MQPutMessageOptions();
                        pmo.options = MQConstants.MQPMO_NO_SYNCPOINT;

                        replyQueue.put(reply, pmo);
                        System.out.println("Sent reply to: " + replyToQueueName);
                        replyQueue.close();
                    }
                } catch (MQException mqe) {
                    if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
                        System.out.println("No message received. Exiting.");
                        break;
                    } else {
                        throw mqe;
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (requestQueue != null) requestQueue.close();
                if (qMgr != null) qMgr.disconnect();
            } catch (MQException e) {
                e.printStackTrace();
            }
        }
    }
}
