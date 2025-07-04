package com.ibm.mq.samples.java;
import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;
import org.json.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;

public class BasicPub {

    private static class MQDetails {
        String QMGR;
        String TOPIC_NAME;
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
        publishToTopic(mqDetails);
        System.out.println("Sample MQ PUB application ending");
    }

    private static void loadEnv(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            JSONObject env = new JSONObject(content);
            JSONObject endpoint = env.getJSONArray("MQ_ENDPOINTS").getJSONObject(0);

            mqDetails = new MQDetails();
            mqDetails.QMGR = endpoint.getString("QMGR");
            mqDetails.TOPIC_NAME = endpoint.getString("TOPIC_NAME");
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

    private static void publishToTopic(MQDetails d) {
        MQQueueManager qMgr = null;
        MQTopic topic = null;

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

            // Access using topic object name, not just string
            topic = qMgr.accessTopic(
                d.TOPIC_NAME,
                null, // Topic Object defined in MQ
                MQConstants.MQTOPIC_OPEN_AS_PUBLICATION,
                MQConstants.MQOO_OUTPUT
            );

            MQMessage msg = new MQMessage();
            msg.format = MQConstants.MQFMT_STRING;

            String payload = "{\"Greeting\": \"Hello from Java publisher at " + java.time.Instant.now() + "\"}";
            msg.writeString(payload);

            MQPutMessageOptions pmo = new MQPutMessageOptions();
            pmo.options = MQConstants.MQPMO_NO_SYNCPOINT |
                          MQConstants.MQPMO_NEW_MSG_ID |
                          MQConstants.MQPMO_NEW_CORREL_ID |
                          MQConstants.MQPMO_WARN_IF_NO_SUBS_MATCHED;

            topic.put(msg, pmo);

            //System.out.println("Published message to topic object: DEV.BASE.TOPIC");
            System.out.println("Message content: " + payload);

        } catch (MQException mqe) {
            if (mqe.reasonCode == MQConstants.MQRC_NO_SUBS_MATCHED) {
                System.out.println("Warning: No subscribers matched the topic.");
            } else {
                mqe.printStackTrace();
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (topic != null) topic.close();
                if (qMgr != null) qMgr.disconnect();
            } catch (MQException me) {
                me.printStackTrace();
            }
        }
    }
}
