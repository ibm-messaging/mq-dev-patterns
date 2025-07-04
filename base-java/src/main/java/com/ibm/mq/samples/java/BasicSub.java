package com.ibm.mq.samples.java;
import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;
import org.json.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;

public class BasicSub {

    private static class MQDetails {
        String QMGR;
        String SUB_NAME;
        String QUEUE_NAME;
        String HOST;
        String PORT;
        String CHANNEL;
        String USER;
        String PASSWORD;
        String KEY_REPOSITORY;
        String CIPHER;
    }

    private static MQDetails mqDetails;

    public static void main(String[] args) {
        loadEnv("env.json");
        subscribeToQueue(mqDetails);
        System.out.println("Sample MQ durable SUB application ending");
    }

    private static void loadEnv(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            JSONObject env = new JSONObject(content);
            JSONObject endpoint = env.getJSONArray("MQ_ENDPOINTS").getJSONObject(0);

            mqDetails = new MQDetails();
            mqDetails.QMGR = endpoint.getString("QMGR");
            mqDetails.SUB_NAME = endpoint.getString("SUB_NAME");
            mqDetails.QUEUE_NAME = endpoint.getString("QUEUE_NAME"); // ✅ Fix
            mqDetails.HOST = endpoint.getString("HOST");
            mqDetails.PORT = String.valueOf(endpoint.getInt("PORT"));
            mqDetails.CHANNEL = endpoint.getString("CHANNEL");
            mqDetails.USER = endpoint.getString("APP_USER");
            mqDetails.PASSWORD = endpoint.getString("APP_PASSWORD");
            mqDetails.KEY_REPOSITORY = endpoint.optString("KEY_REPOSITORY", "");
            mqDetails.CIPHER = endpoint.optString("CIPHER", "");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void subscribeToQueue(MQDetails d) {
        MQQueueManager qMgr = null;
        MQQueue queue = null;

        try {
            Hashtable<String, Object> props = new Hashtable<>();

            String ccdtUrl = System.getenv("MQCCDTURL");
            if (ccdtUrl != null && ccdtUrl.startsWith("file://")) {
                String ccdtPath = ccdtUrl.replace("file://", "");
                System.setProperty("MQCCDTURL", ccdtPath);
                System.out.println("Using CCDT at: " + ccdtPath);
            } else {
                props.put(MQConstants.HOST_NAME_PROPERTY, d.HOST);
                props.put(MQConstants.PORT_PROPERTY, Integer.parseInt(d.PORT));
                props.put(MQConstants.CHANNEL_PROPERTY, d.CHANNEL);
            }

            props.put(MQConstants.USER_ID_PROPERTY, d.USER);
            props.put(MQConstants.PASSWORD_PROPERTY, d.PASSWORD);
            props.put(MQConstants.TRANSPORT_PROPERTY, MQConstants.TRANSPORT_MQSERIES_CLIENT);

            if (!d.KEY_REPOSITORY.isEmpty()) {
                props.put(MQConstants.SSL_CIPHER_SUITE_PROPERTY, d.CIPHER);
                System.setProperty("com.ibm.mq.ssl.keyStore", d.KEY_REPOSITORY);
                System.setProperty("com.ibm.mq.ssl.keyStorePassword", "");
            }

            qMgr = new MQQueueManager(d.QMGR, props);
            System.out.println("Connected to queue manager: " + d.QMGR);

            int openOptions = MQConstants.MQOO_INPUT_AS_Q_DEF | MQConstants.MQOO_FAIL_IF_QUIESCING;
            queue = qMgr.accessQueue(d.QUEUE_NAME, openOptions);

            receiveMessages(queue);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (queue != null) queue.close();
                if (qMgr != null) qMgr.disconnect();
            } catch (MQException e) {
                e.printStackTrace();
            }
        }
    }

    private static void receiveMessages(MQQueue queue) {
        try {
            MQMessage msg = new MQMessage();
            MQGetMessageOptions gmo = new MQGetMessageOptions();
            gmo.options = MQConstants.MQGMO_NO_SYNCPOINT |
                          MQConstants.MQGMO_WAIT |
                          MQConstants.MQGMO_CONVERT |
                          MQConstants.MQGMO_FAIL_IF_QUIESCING;
            gmo.waitInterval = 10000;

            System.out.println("Waiting for messages from durable subscription queue...");
            while (true) {
                msg.clearMessage();
                try {
                    queue.get(msg, gmo);
                    String received = msg.readStringOfByteLength(msg.getDataLength());
                    System.out.println("Received: " + received);
                } catch (MQException mqe) {
                    if (mqe.reasonCode == MQConstants.MQRC_NO_MSG_AVAILABLE) {
                        System.out.println("No messages. Exiting.");
                        break;
                    } else {
                        throw mqe;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
