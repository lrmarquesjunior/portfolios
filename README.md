# ☁️ Portfólio AWS — Soluções em Nuvem

Bem-vindo ao meu portfólio de projetos AWS. Aqui documento arquiteturas, integrações e soluções que desenvolvo ao longo da minha jornada de estudos e na minha atuação em projetos reais.

---

## 📌 Sobre a Documentação dos Projetos

Os projetos iniciais foram documentados com **prints de tela** para comprovar o funcionamento e mostrar o fluxo completo, pois sou muito visual. Alguns projetos vão continuar assim, pois é o formato mais direto para demonstrar que funciona mesmo.

Vai notar que números de conta, nomes de buckets e ARNs aparecem em alguns prints. Vou seguir assim pois logo após validar o funcionamento, faço backup e destruo o ambiente por conta de custos — minha conta já saiu do free tier faz tempo, e recriar conta nova toda hora, cartão de crédito, etc... é demorado demais.

Além dos prints, vou incluir diagramas do Draw.io, pois como disse acime, sou muito visual e esse formato me ajuda tanto no aprendizado quanto na documentação. Onde fizer sentido, vou explicar também os porquês...

A ideia é evoluir gradualmente, sem me prender a um padrão rígido desde o início. A prioridade é publicar e aprender, um projeto de cada vez. 
Um passo de cada vez...

---

## 📁 Estrutura do Portfólio

| Pasta | Descrição |
|---|---|
| [AWS](./AWS/) | Projetos de infraestrutura e serviços AWS gerais |
| [Amazon-Connect](./Amazon-Connect/) | Projetos focados em contact center (Amazon Connect) |

---

## 🚀 Projetos em Destaque

### Amazon Connect
- [01 - Connect Básico + Lex](./Amazon-Connect/01-connect-basico-lex/)
- [02-connect-email-route53-ses-sns-sqs](./Amazon-Connect/02-02-connect-email-route53-ses-sns-sqs/)
- Próximos Projetos - Em Andamento

---

### AWS Geral
- [01 - VPC + ALB + CloudFront](./AWS/01-vpc-alb-cloudfront/)
- [02 - ECS + ECR + Spring Boot](./AWS/02-ecs-ecr-spring-boot/)
- Próximos Projetos - Em Andamento

---

## 📜 Em Andamento

- [    ] AWS Certified Solutions Architect
- [Done] AWS Certified Cloud Practitioner

---

## 🔐 Próximos Passos

Vou tentar fazer com que os projetos futuros "tenham cada vez mais cara" de ambiente corporativo:

- **Segurança** — IAM, Secrets, KMS, etc...
- **Autenticação** — Cognito e federação com Identity Providers (AD/SAML), tema que já aplico no Connect corporativo 
- **Resiliência** — redundância multi-AZ, o Connect já é multi-AZ por ser SaaS, mas falo dos demais serviços
- **IaC** — Terraform (preciso me aprofundar aqui com certa urgência)
- **CI/CD** — no ambiente corporativo já utilizamos GitLab → ECR → AWS CodePipeline → ECS, minha ideia para os "projetitos"

---

*enfim... Novos projetos serão adicionados conforme avanço nos estudos e o meu envolvimento em projetos reais. Um passo de cada vez...