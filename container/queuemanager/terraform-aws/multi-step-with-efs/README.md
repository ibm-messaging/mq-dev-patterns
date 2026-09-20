# Mi implementacion del tutorial de IBM MQ en AWS

> Implementacion personal basada en el tutorial de IBM:
> [Get an IBM MQ queue for development running on AWS Cloud using Terraform](https://developer.ibm.com/tutorials/mq-connect-app-queue-manager-cloud-aws-terraform/)

Este directorio contiene el despliegue de un queue manager IBM MQ en AWS usando Terraform, ECS/Fargate y EFS para almacenamiento persistente.

## Lo que hice

- Cree una VPC en `eu-west-1` con subredes publicas y privadas.
- Desplegue un sistema de archivos EFS y un access point para el almacenamiento persistente de MQ.
- Inicialice el almacenamiento mediante la etapa `03-mq-init`.
- Desplegue el queue manager `QM1` en ECS/Fargate mediante `04-mq-qmgr`.
- Expuse el servicio mediante un Network Load Balancer.
- Publique un mensaje persistente usando la API REST de IBM MQ y `curl`.
- Verifique que la peticion devolviera `201 Created`.

## Estructura

| Etapa | Descripcion |
| --- | --- |
| `01-vpc` | Crea la red VPC y sus subredes. |
| `02-efs` | Crea EFS y el access point para MQ. |
| `03-mq-init` | Inicializa el almacenamiento requerido por MQ. |
| `04-mq-qmgr` | Despliega QM1 en ECS/Fargate y configura el balanceador. |

## Comandos principales

Los comandos se ejecutaron desde cada directorio de etapa:

```powershell
terraform init
terraform plan
terraform apply
```

En la etapa del queue manager se proporcionaron los valores de la infraestructura existente y la region:

```powershell
terraform apply `
  -var vpc_id="<vpc-id>" `
  -var efs_id="<efs-id>" `
  -var efs_access_point="<efs-access-point-id>" `
  -var region="eu-west-1"
```

Las contrasenas de MQ se deben proporcionar como variables sensibles y nunca escribirse en este README ni en el repositorio:

```powershell
terraform apply `
  -var mq_app_password="<app-password>" `
  -var mq_admin_password="<admin-password>"
```

Para obtener el DNS del balanceador despues del despliegue:

```powershell
terraform output load_balancer_dns_name
```

## Publicar un mensaje de prueba

Sustituye `<load-balancer-dns>` por el valor del output anterior y usa la contrasena real del usuario `app`:

```powershell
curl.exe -i -k -X POST `
  -u "app:<app-password>" `
  --header "Content-Type: text/plain; charset=utf-8" `
  --header "Accept: application/json" `
  --header "ibm-mq-rest-csrf-token: blank" `
  --header "ibm-mq-md-expiry: unlimited" `
  --header "ibm-mq-md-persistence: persistent" `
  --data "This is a persistent message" `
  "https://<load-balancer-dns>/ibmmq/rest/v3/messaging/qmgr/QM1/queue/DEV.QUEUE.1/message"
```

La respuesta esperada para la publicacion correcta es `HTTP/1.1 201 Created`.

> `-k` desactiva la validacion del certificado TLS y se uso solamente para esta prueba. En un entorno real se debe configurar un certificado confiable y evitar `-k`.

## Seguridad y limpieza antes de publicar

Antes de subir el proyecto a GitHub, verifica que no se incluyan:

- Credenciales o contrasenas de AWS o IBM MQ.
- `terraform.tfstate` o `terraform.tfstate.backup`.
- La carpeta `.terraform/`.
- Archivos `.tfvars` con valores reales.
- Claves privadas, tokens o archivos locales de configuracion.

Los recursos de AWS generan costes mientras permanecen activos. Cuando termines las pruebas, ejecuta `terraform destroy` en cada etapa siguiendo el orden inverso del despliegue.
