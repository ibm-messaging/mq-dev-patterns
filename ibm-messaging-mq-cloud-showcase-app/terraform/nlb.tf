#  Copyright 2022, 2026 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.


resource "aws_lb" "nlb" {
  name               = "mqonaws-nlb"
  load_balancer_type = "network"
  internal           = false
  subnets            = data.aws_subnets.public.ids
  security_groups    = [aws_security_group.nlb.id]
}

# NLB:80->frontend container:3000
resource "aws_lb_target_group" "frontend" {
  name        = "mqonaws-fe-tg"
  port        = var.frontend_port
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default.id

  deregistration_delay = 30

  health_check {
    protocol = "TCP"
  }
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# NLB:9443->MQ console:9443
resource "aws_lb_target_group" "mq_console" {
  name        = "mqonaws-console-tg"
  port        = var.mq_console_port
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default.id

  deregistration_delay = 30

  health_check {
    protocol = "TCP"
  }
}

resource "aws_lb_listener" "mq_console" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = var.mq_console_port
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mq_console.arn
  }
}
