using System;
using IBM.XMS;

namespace ibmmq_samples
{
    class ConnectionPropertyBuilder
    {
        static public void SetConnectionProperties(IConnectionFactory cf, Env env)
        {
            Env.ConnVariables conn = env.Conn;

            if (env.NumberOfConnections() > 1)
            {
                Console.WriteLine("There are {0} connections", env.NumberOfConnections());
                cf.SetStringProperty(XMSC.WMQ_CONNECTION_NAME_LIST, env.BuildConnectionString());
                Console.WriteLine("Connection string is {0}", env.BuildConnectionString());
            }
            else
            {
                cf.SetStringProperty(XMSC.WMQ_HOST_NAME, conn.host);
                Console.WriteLine("hostName is set {0, -20 }", conn.host);
                cf.SetIntProperty(XMSC.WMQ_PORT, conn.port);
            }

            cf.SetStringProperty(XMSC.WMQ_CHANNEL, conn.channel);
            if (conn.key_repository != null && (conn.key_repository.Contains("*SYSTEM") || conn.key_repository.Contains("*USER")))
            {
                cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, XMSC.WMQ_CM_CLIENT);
            }
            else
            {
                cf.SetIntProperty(XMSC.WMQ_CONNECTION_MODE, XMSC.WMQ_CM_CLIENT_UNMANAGED);
            }

            cf.SetStringProperty(XMSC.WMQ_QUEUE_MANAGER, conn.qmgr);
            cf.SetStringProperty(XMSC.USERID, conn.app_user);
            cf.SetStringProperty(XMSC.PASSWORD, conn.app_password);
            if (conn.key_repository != null && conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_KEY_REPOSITORY, conn.key_repository);
            }
            if (conn.cipher_suite != null)
            {
                cf.SetStringProperty(XMSC.WMQ_SSL_CIPHER_SPEC, conn.cipher_suite);
            }
        }

    }
}
