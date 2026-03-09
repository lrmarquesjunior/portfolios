# portfolios
# ☁️ AWS Cloud Portfolio

Portfólio de projetos utilizando arquitetura em nuvem com AWS.

Projetos focados em:

- Arquitetura cloud
- Alta disponibilidade
- Automação

---

# Projetos

## 1 - VPC + ALB + CloudFront + Lambda + EventBridge

Arquitetura de site altamente disponível utilizando:

1 VPC
	vpc-doacao
2 subnets públicas e privadas
	subnet-doa-priv01 (us-east-1d)
	subnet-doa-pub01 (us-east-1d)
	subnet-doa-priv02 (us-east-1e)
	subnet-doa-pub02 (us-east-1e)
2 AZs
	us-east-1d
	us-east-1e
Internet Gateway
	igw-doa-public
NAT Gateway
	natgw-doa-public
Route tables
	rtb-doa-public
	rtb-doa-private
2 EC2
	ec2-01 (us-east-1d / subnet-doa-pub01)
	ec2-02 (us-east-1e / subnet-doa-pub02)
Grupos de Segurança:
	sg_alb
	sg_ec2_doacao
Load balancers
	alb-doacao
Target Groups
	tg-doacao
S3
	Fotos e áudio
Lambda
	desligar-ec2 (para Event Bridge)
Event Bridge
	Cron: Desligar e Ligar EC2
CloudFront
	Para certificado
URLs
	https://bit.ly/campanha-solidaria-adrian (encurtador de URL)
	http://alb-doacao-892051055.us-east-1.elb.amazonaws.com/
	https://d2y33o6jtz5yzo.cloudfront.net/


Objetivo:
Hospedar site de campanha solidária com alta disponibilidade e automação de custos.