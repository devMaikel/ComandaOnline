# 🍻 ComandaOnline - Sistema de Gerenciamento para Bares e Restaurantes

Um sistema completo para gerenciar comandas em bares e restaurantes, com aplicativos para **garçons**, **donos** e **clientes**, além de um **painel web** em tempo real.

---

## 📱 Aplicativos Móveis (React Native)

### **App para Garçons**

- Abrir/fechar comandas
- Adicionar/remover itens do cardápio
- Geração de QR Code com link para página de visualização para cada cliente
- Fechar contas (dinheiro, cartão, PIX, etc.)

### **App para Donos**

- Gerenciamento de cardápio (adicionar, editar, remover itens)
- Visualização de comandas em tempo real
- Relatórios de vendas e desempenho

---

## 🌐 Frontend Web (Next.js)

**Página do Cliente** (acessada via QR Code):
✔ Visualização da comanda em tempo real e com detalhes
✔ Opção para chamar o garçom ou solicitar fechamento

---

## ⚙️ Backend (Next.js API Routes / App Router)

- **API REST** para:
  - Comandas, pedidos, cardápio, pagamentos
  - Autenticação (JWT)
  - Geração de links únicos (UUID/short hash)

---

## 🗃️ Banco de Dados (PostgreSQL + Prisma ORM)

| Tabela             | Descrição                   |
| ------------------ | --------------------------- |
| `users`            | Usuários (garçons, donos)   |
| `bars`             | Estabelecimentos            |
| `menus`            | Itens do cardápio           |
| `orders`           | Pedidos                     |
| `commands`         | Comandas                    |
| `items_in_command` | Itens vinculados a comandas |
| `payments`         | Registros de pagamento      |

---

## 🚀 Funcionalidades Principais

### **App Android/iOS React Native**

| Funcionalidade     | Descrição                         |
| ------------------ | --------------------------------- |
| ✅ Login multi-bar | Suporte a vários estabelecimentos |
| 🎯 QR Code         | Geração automática por comanda    |
| 💸 Pagamentos      | Dinheiro, cartão, PIX, etc.       |

### **App Web Next.JS**

| Funcionalidade                                                            | Descrição                         |
| ------------------------------------------------------------------------- | --------------------------------- |
| ✅ Visualização da comanda em tempo real e com detalhes através de QRcode | Suporte a vários estabelecimentos |

## 🛠️ Stack Tecnológica

| Tecnologia       | Uso                                 |
| ---------------- | ----------------------------------- |
| **React Native** | Apps móveis (Expo/CLI + TypeScript) |
| **Next.js**      | Frontend web e API                  |
| **Prisma**       | ORM para PostgreSQL                 |
| **Tailwind CSS** | Estilização do frontend web         |
