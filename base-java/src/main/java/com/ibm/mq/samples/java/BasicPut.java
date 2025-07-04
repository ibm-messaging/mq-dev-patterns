package com.ibm.mq.samples.java;
import com.ibm.mq.*;
import com.ibm.mq.constants.MQConstants;
import org.json.*;

import java.io.FileReader;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Hashtable;

public class BasicPut {

    private static class MQDetails {
        String QMGR;
        String QUEUE_NAME;
        String HOST;
        String PORT;
        String CHANNEL;
        String USER;
        String PASSWORD;
        String KEY_REPOSITORY;
        String CIPHER;
    }

    private static JSONArray endpoints;

    public static void main(String[] args) {
        loadEnv("env.json");

        for (int i = 0; i < endpoints.length(); i++) {
            System.out.println("Processing endpoint " + i);
            JSONObject point = endpoints.getJSONObject(i);
            MQDetails details = buildMQDetails(point);
            processEndpoint(details);
        }

        System.out.println("Sample MQ PUT application ending");
        System.exit(0);
    }

    private static void loadEnv(String path) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(path)));
            JSONObject env = new JSONObject(content);
            endpoints = env.getJSONArray("MQ_ENDPOINTS");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static MQDetails buildMQDetails(JSONObject endpoint) {
        MQDetails mq = new MQDetails();
        mq.QMGR = endpoint.getString("QMGR");
        mq.QUEUE_NAME = endpoint.getString("QUEUE_NAME");
        mq.HOST = endpoint.getString("HOST");
        mq.PORT = String.valueOf(endpoint.getInt("PORT"));
        mq.CHANNEL = endpoint.getString("CHANNEL");
        mq.USER = endpoint.getString("APP_USER");
        mq.PASSWORD = endpoint.getString("APP_PASSWORD");
        mq.KEY_REPOSITORY = endpoint.optString("KEY_REPOSITORY", "");
        mq.CIPHER = endpoint.optString("CIPHER", "");
        return mq;
    }

    private static void processEndpoint(MQDetails details) {
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
                props.put(MQConstants.HOST_NAME_PROPERTY, details.HOST);
                props.put(MQConstants.PORT_PROPERTY, Integer.parseInt(details.PORT));
                props.put(MQConstants.CHANNEL_PROPERTY, details.CHANNEL);
            }

            props.put(MQConstants.USER_ID_PROPERTY, details.USER);
            props.put(MQConstants.PASSWORD_PROPERTY, details.PASSWORD);
            props.put(MQConstants.TRANSPORT_PROPERTY, MQConstants.TRANSPORT_MQSERIES_CLIENT);

            if (!details.KEY_REPOSITORY.isEmpty()) {
                props.put(MQConstants.SSL_CIPHER_SUITE_PROPERTY, details.CIPHER);
                System.setProperty("com.ibm.mq.ssl.keyStore", details.KEY_REPOSITORY);
                System.setProperty("com.ibm.mq.ssl.keyStorePassword", "");
            }

            qMgr = new MQQueueManager(details.QMGR, props);
            System.out.println("Connected to queue manager: " + details.QMGR);

            int openOptions = MQConstants.MQOO_OUTPUT;
            queue = qMgr.accessQueue(details.QUEUE_NAME, openOptions);

            MQMessage msg = new MQMessage();
            msg.format = MQConstants.MQFMT_STRING;

            // Hardcoded message body for simplicity
            String payload = "{\"greeting\": \"Hello from BasicPut.java\"}";
            msg.writeString(payload);

            MQPutMessageOptions pmo = new MQPutMessageOptions();
            queue.put(msg, pmo);

            System.out.println("Message put successfully: " + payload);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (queue != null) queue.close();
                if (qMgr != null) qMgr.disconnect();
            } catch (MQException me) {
                me.printStackTrace();
            }
        }
    }
}
