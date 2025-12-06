# План монетизации PromptyFlow

## Оглавление

1. [Обзор](#обзор)
2. [Тарифные планы](#тарифные-планы)
3. [Техническая реализация](#техническая-реализация)
4. [Stripe интеграция](#stripe-интеграция)
5. [Изменения в БД](#изменения-в-бд)
6. [Backend разработка](#backend-разработка)
7. [Frontend разработка](#frontend-разработка)
8. [Панель администратора](#панель-администратора)
9. [Промокоды и бета-доступ](#промокоды-и-бета-доступ)
10. [Безопасность и compliance](#безопасность-и-compliance)
11. [Тестирование](#тестирование)
12. [Оценка времени и стоимости](#оценка-времени-и-стоимости)

---

## Обзор

Документ описывает план внедрения платного функционала в PromptyFlow с использованием Stripe как платежного шлюза.

**Цели:**
- Монетизация платформы через подписочную модель
- Гибкая система тарифов (FREE, PRO, BETA)
- Демо-период 30 дней для PRO
- Система промокодов
- Специальный доступ для бета-тестеров

---

## Тарифные планы

### FREE (Бесплатный)

**Ограничения:**
- Проекты: до 10
- Размер проекта: до 1M символов
- Размер контекстного блока: до 500K символов
- Количество промптов: без ограничений
- Количество AI провайдеров: до 2

**Стоимость:** $0/месяц

---

### PRO (Профессиональный)

**Возможности:**
- Проекты: до 100
- Размер проекта: до 10M символов
- Размер контекстного блока: до 5M символов
- Количество промптов: без ограничений
- Количество AI провайдеров: без ограничений
- Приоритетная поддержка
- Расширенная статистика
- Экспорт/импорт проектов

**Стоимость:** $9.99/месяц или $99/год (-17%)

**Демо-период:** 30 дней бесплатно

---

### BETA (Бета-тестеры)

**Возможности:**
- Все возможности PRO
- Без ограничений
- Бессрочный доступ
- Приоритет в новых фичах
- Прямая связь с командой разработки

**Стоимость:** $0/месяц (пожизненно)

**Активация:** Только по специальному коду

---

## Техническая реализация

### Архитектура системы подписок

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  PricingPage  │  CheckoutModal  │  SubscriptionPanel        │
│  PromoCode    │  BillingHistory │  CancelSubscription       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ API Requests
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Fastify + Prisma)                │
├─────────────────────────────────────────────────────────────┤
│  subscription.service.ts    │  stripe.service.ts            │
│  promo.service.ts           │  billing.service.ts           │
│  plan-limits.middleware.ts  │  webhook.handler.ts           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Webhooks & API calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                         Stripe API                           │
├─────────────────────────────────────────────────────────────┤
│  Customers  │  Subscriptions  │  Invoices  │  Webhooks      │
└─────────────────────────────────────────────────────────────┘
```

---

## Stripe интеграция

### 1. Настройка Stripe аккаунта

**Шаги:**
1. Регистрация на stripe.com
2. Получение API ключей (test и live)
3. Настройка webhook endpoints
4. Создание продуктов и цен
5. Настройка налогов (если требуется)

**Переменные окружения:**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products (создаются в dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
```

---

### 2. Stripe Products в Dashboard

**Product 1: PromptyFlow PRO - Monthly**
- Name: PromptyFlow PRO (Monthly)
- Price: $9.99
- Billing: Recurring / Monthly
- Trial: 30 days

**Product 2: PromptyFlow PRO - Yearly**
- Name: PromptyFlow PRO (Yearly)
- Price: $99.00
- Billing: Recurring / Yearly
- Trial: 30 days

---

### 3. Webhook Events

Обрабатываемые события:

```typescript
// Критичные события
customer.subscription.created      // Новая подписка
customer.subscription.updated      // Обновление подписки
customer.subscription.deleted      // Отмена подписки
customer.subscription.trial_will_end // Окончание триала (за 3 дня)

// Платежи
invoice.payment_succeeded          // Успешный платеж
invoice.payment_failed             // Неудачный платеж
invoice.upcoming                   // Предстоящий платеж (за 7 дней)

// Клиенты
customer.created                   // Новый клиент
customer.updated                   // Обновление клиента
customer.deleted                   // Удаление клиента
```

---

## Изменения в БД

### Prisma Schema изменения

```prisma
model User {
  id String @id @default(uuid())
  
  googleId String @unique @map("google_id")
  email    String @unique
  name     String
  avatarUrl String? @map("avatar_url")
  
  language String @default("en")
  theme    String @default("dark")
  
  // Subscription fields
  plan              String   @default("free") // free | pro | beta
  stripeCustomerId  String?  @unique @map("stripe_customer_id")
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  subscriptionStatus String? @map("subscription_status") // active | trialing | canceled | past_due
  trialEndsAt       DateTime? @map("trial_ends_at")
  subscriptionEndsAt DateTime? @map("subscription_ends_at")
  
  projects    Project[]
  templates   Template[]
  apiKeys     ApiKey[]
  promoCodes  UserPromoCode[]
  billingHistory BillingHistory[]
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model PromoCode {
  id String @id @default(uuid())
  
  code        String  @unique
  description String?
  type        String  // beta | discount | trial_extension
  
  // Для discount
  discountPercent Int? @map("discount_percent") // 0-100
  discountMonths  Int? @map("discount_months")  // Количество месяцев со скидкой
  
  // Для beta
  grantsBetaAccess Boolean @default(false) @map("grants_beta_access")
  
  // Для trial_extension
  extraTrialDays Int? @map("extra_trial_days")
  
  maxUses       Int?     // null = unlimited
  currentUses   Int      @default(0) @map("current_uses")
  
  isActive      Boolean  @default(true) @map("is_active")
  expiresAt     DateTime? @map("expires_at")
  
  users UserPromoCode[]
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("promo_codes")
}

model UserPromoCode {
  id String @id @default(uuid())
  
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  promoCodeId String    @map("promo_code_id")
  promoCode   PromoCode @relation(fields: [promoCodeId], references: [id], onDelete: Cascade)
  
  appliedAt DateTime @default(now()) @map("applied_at")
  
  @@unique([userId, promoCodeId])
  @@index([userId])
  @@index([promoCodeId])
  @@map("user_promo_codes")
}

model BillingHistory {
  id String @id @default(uuid())
  
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  stripeInvoiceId String  @unique @map("stripe_invoice_id")
  amount          Int     // В центах
  currency        String  @default("usd")
  status          String  // paid | pending | failed
  
  description     String?
  invoiceUrl      String? @map("invoice_url")
  
  paidAt DateTime? @map("paid_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@map("billing_history")
}

model PlanLimits {
  id String @id @default(uuid())
  
  plan String @unique // free | pro | beta
  
  maxProjects           Int @map("max_projects")
  maxProjectSize        Int @map("max_project_size") // В символах
  maxContextBlockSize   Int @map("max_context_block_size")
  maxAIProviders        Int @map("max_ai_providers")
  
  features Json // JSONB для дополнительных фич
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("plan_limits")
}
```

---

### Миграция данных

```sql
-- 20251206_add_subscription_system.sql

-- Добавление полей подписки в users
ALTER TABLE "users" ADD COLUMN "plan" VARCHAR(20) DEFAULT 'free';
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "subscription_status" VARCHAR(50);
ALTER TABLE "users" ADD COLUMN "trial_ends_at" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "subscription_ends_at" TIMESTAMP;

CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- Создание таблицы promo_codes
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "discount_percent" INTEGER,
    "discount_months" INTEGER,
    "grants_beta_access" BOOLEAN DEFAULT false,
    "extra_trial_days" INTEGER,
    "max_uses" INTEGER,
    "current_uses" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "expires_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- Создание таблицы user_promo_codes
CREATE TABLE "user_promo_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "promo_code_id" TEXT NOT NULL,
    "applied_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "user_promo_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_promo_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_promo_codes_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "user_promo_codes_user_id_promo_code_id_key" ON "user_promo_codes"("user_id", "promo_code_id");
CREATE INDEX "user_promo_codes_user_id_idx" ON "user_promo_codes"("user_id");
CREATE INDEX "user_promo_codes_promo_code_id_idx" ON "user_promo_codes"("promo_code_id");

-- Создание таблицы billing_history
CREATE TABLE "billing_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_invoice_id" VARCHAR(255) NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'usd',
    "status" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "invoice_url" TEXT,
    "paid_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "billing_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "billing_history_stripe_invoice_id_key" ON "billing_history"("stripe_invoice_id");
CREATE INDEX "billing_history_user_id_idx" ON "billing_history"("user_id");

-- Создание таблицы plan_limits
CREATE TABLE "plan_limits" (
    "id" TEXT NOT NULL,
    "plan" VARCHAR(20) NOT NULL,
    "max_projects" INTEGER NOT NULL,
    "max_project_size" INTEGER NOT NULL,
    "max_context_block_size" INTEGER NOT NULL,
    "max_ai_providers" INTEGER NOT NULL,
    "features" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_limits_plan_key" ON "plan_limits"("plan");

-- Заполнение plan_limits дефолтными значениями
INSERT INTO "plan_limits" ("id", "plan", "max_projects", "max_project_size", "max_context_block_size", "max_ai_providers", "features") VALUES
('free-plan', 'free', 10, 1000000, 500000, 2, '{"export": false, "priority_support": false, "advanced_stats": false}'::jsonb),
('pro-plan', 'pro', 100, 10000000, 5000000, 999, '{"export": true, "priority_support": true, "advanced_stats": true}'::jsonb),
('beta-plan', 'beta', 999999, 999999999, 999999999, 999, '{"export": true, "priority_support": true, "advanced_stats": true, "unlimited": true}'::jsonb);
```

---

## Backend разработка

### 1. Stripe Service

```typescript
// apps/api/src/services/stripe.service.ts

import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Создание клиента в Stripe
   */
  async createCustomer(userId: string, email: string, name: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Stripe customer created: ${customer.id} for user ${userId}`);
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Создание checkout session для подписки
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    promoCode?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Создаем клиента если его еще нет
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.createCustomer(userId, user.email, user.name);
      customerId = customer.id;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      subscription_data: {
        trial_period_days: 30,
        metadata: { userId },
      },
      metadata: { userId },
    };

    // Применяем промокод если указан
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode, isActive: true },
      });

      if (promo && promo.type === 'discount' && promo.discountPercent) {
        const coupon = await this.stripe.coupons.create({
          percent_off: promo.discountPercent,
          duration: 'repeating',
          duration_in_months: promo.discountMonths || 12,
        });
        sessionParams.discounts = [{ coupon: coupon.id }];
      }
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);
    return session;
  }

  /**
   * Создание portal session для управления подпиской
   */
  async createPortalSession(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    return session;
  }

  /**
   * Отмена подписки
   */
  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  }

  /**
   * Получение информации о подписке
   */
  async getSubscription(subscriptionId: string) {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Получение списка инвойсов
   */
  async getInvoices(customerId: string, limit = 10) {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  }
}
```

---

### 2. Subscription Service

```typescript
// apps/api/src/services/subscription.service.ts

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export class SubscriptionService {
  /**
   * Обновление подписки пользователя
   */
  async updateSubscription(
    userId: string,
    data: {
      plan?: string;
      subscriptionStatus?: string;
      stripeSubscriptionId?: string;
      trialEndsAt?: Date | null;
      subscriptionEndsAt?: Date | null;
    }
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Проверка доступа к PRO функциям
   */
  async hasProAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Beta всегда имеет доступ
    if (user.plan === 'beta') return true;

    // PRO с активной подпиской
    if (user.plan === 'pro') {
      if (user.subscriptionStatus === 'active') return true;
      if (user.subscriptionStatus === 'trialing') return true;
    }

    return false;
  }

  /**
   * Получение лимитов плана
   */
  async getPlanLimits(plan: string) {
    const limits = await prisma.planLimits.findUnique({ where: { plan } });
    if (!limits) {
      // Дефолтные лимиты для free
      return {
        maxProjects: 10,
        maxProjectSize: 1_000_000,
        maxContextBlockSize: 500_000,
        maxAIProviders: 2,
        features: {
          export: false,
          priority_support: false,
          advanced_stats: false,
        },
      };
    }
    return limits;
  }

  /**
   * Проверка лимита проектов
   */
  async checkProjectLimit(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const limits = await this.getPlanLimits(user.plan);
    const projectCount = await prisma.project.count({ where: { userId } });

    return projectCount < limits.maxProjects;
  }

  /**
   * Проверка лимита размера проекта
   */
  async checkProjectSizeLimit(userId: string, size: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const limits = await this.getPlanLimits(user.plan);
    return size <= limits.maxProjectSize;
  }
}
```

---

### 3. Webhook Handler

```typescript
// apps/api/src/routes/stripe.routes.ts

import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { StripeService } from '../services/stripe.service';
import { SubscriptionService } from '../services/subscription.service';
import { logger } from '../lib/logger';

export async function stripeRoutes(app: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const stripeService = new StripeService();
  const subscriptionService = new SubscriptionService();

  /**
   * Webhook endpoint для Stripe событий
   */
  app.post(
    '/webhooks/stripe',
    {
      config: {
        rawBody: true, // Важно для проверки подписи
      },
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'] as string;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody!,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: any) {
        logger.error('Webhook signature verification failed:', err.message);
        return reply.code(400).send({ error: 'Invalid signature' });
      }

      logger.info(`Received Stripe event: ${event.type}`);

      try {
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = subscription.metadata.userId;

            await subscriptionService.updateSubscription(userId, {
              plan: 'pro',
              subscriptionStatus: subscription.status,
              stripeSubscriptionId: subscription.id,
              trialEndsAt: subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null,
              subscriptionEndsAt: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            });

            logger.info(`Subscription updated for user ${userId}`);
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = subscription.metadata.userId;

            await subscriptionService.updateSubscription(userId, {
              plan: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              trialEndsAt: null,
              subscriptionEndsAt: null,
            });

            logger.info(`Subscription canceled for user ${userId}`);
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            // Сохраняем в billing history
            const user = await prisma.user.findUnique({
              where: { stripeCustomerId: customerId },
            });

            if (user) {
              await prisma.billingHistory.create({
                data: {
                  userId: user.id,
                  stripeInvoiceId: invoice.id,
                  amount: invoice.amount_paid,
                  currency: invoice.currency,
                  status: 'paid',
                  description: invoice.lines.data[0]?.description || null,
                  invoiceUrl: invoice.hosted_invoice_url || null,
                  paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
                },
              });

              logger.info(`Payment succeeded for user ${user.id}`);
            }
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const user = await prisma.user.findUnique({
              where: { stripeCustomerId: customerId },
            });

            if (user) {
              await prisma.billingHistory.create({
                data: {
                  userId: user.id,
                  stripeInvoiceId: invoice.id,
                  amount: invoice.amount_due,
                  currency: invoice.currency,
                  status: 'failed',
                  description: invoice.lines.data[0]?.description || null,
                  invoiceUrl: invoice.hosted_invoice_url || null,
                },
              });

              // Отправить email о неудачном платеже
              logger.warn(`Payment failed for user ${user.id}`);
            }
            break;
          }

          default:
            logger.info(`Unhandled event type: ${event.type}`);
        }

        return reply.code(200).send({ received: true });
      } catch (error) {
        logger.error('Error processing webhook:', error);
        return reply.code(500).send({ error: 'Webhook processing failed' });
      }
    }
  );
}
```

---

### 4. Plan Limits Middleware

```typescript
// apps/api/src/middleware/planLimits.middleware.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionService } from '../services/subscription.service';

const subscriptionService = new SubscriptionService();

/**
 * Middleware для проверки PRO доступа
 */
export async function requireProPlan(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const hasAccess = await subscriptionService.hasProAccess(userId);

  if (!hasAccess) {
    return reply.code(403).send({
      error: 'PRO subscription required',
      message: 'This feature requires a PRO subscription',
    });
  }
}

/**
 * Middleware для проверки лимита проектов
 */
export async function checkProjectLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  const canCreate = await subscriptionService.checkProjectLimit(userId);

  if (!canCreate) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const limits = await subscriptionService.getPlanLimits(user!.plan);

    return reply.code(403).send({
      error: 'Project limit reached',
      message: `You have reached the limit of ${limits.maxProjects} projects for your ${user!.plan.toUpperCase()} plan`,
      upgrade: user!.plan === 'free',
    });
  }
}
```

---

## Frontend разработка

### 1. Pricing Page

```typescript
// apps/web/src/pages/Pricing.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

export const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createCheckout, isLoading } = useSubscription();

  const plans = [
    {
      id: 'free',
      name: t('pricing.free.name'),
      price: 0,
      period: 'month',
      features: [
        t('pricing.free.projects', { count: 10 }),
        t('pricing.free.size', { size: '1M' }),
        t('pricing.free.providers', { count: 2 }),
      ],
      cta: user?.plan === 'free' ? t('pricing.current') : null,
    },
    {
      id: 'pro',
      name: t('pricing.pro.name'),
      price: 9.99,
      period: 'month',
      yearlyPrice: 99,
      features: [
        t('pricing.pro.projects', { count: 100 }),
        t('pricing.pro.size', { size: '10M' }),
        t('pricing.pro.providers'),
        t('pricing.pro.export'),
        t('pricing.pro.support'),
        t('pricing.pro.stats'),
      ],
      cta: t('pricing.startTrial'),
      popular: true,
    },
  ];

  const handleSubscribe = async (priceId: string) => {
    try {
      const { url } = await createCheckout(priceId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout:', error);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>{t('pricing.title')}</h1>
        <p>{t('pricing.subtitle')}</p>
      </div>

      <div className="pricing-plans">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && (
              <div className="popular-badge">{t('pricing.popular')}</div>
            )}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/{t(`pricing.${plan.period}`)}</span>
              </div>
              {plan.yearlyPrice && (
                <div className="yearly-option">
                  {t('pricing.or')} ${plan.yearlyPrice}/{t('pricing.year')}
                  <span className="discount">-17%</span>
                </div>
              )}
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <svg className="check-icon" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.cta && (
              <button
                className="cta-button"
                onClick={() =>
                  handleSubscribe(process.env.STRIPE_PRICE_ID_PRO_MONTHLY!)
                }
                disabled={isLoading || user?.plan === plan.id}
              >
                {plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="trial-info">
        <p>{t('pricing.trialInfo')}</p>
      </div>

      <div className="promo-code-section">
        <PromoCodeInput />
      </div>
    </div>
  );
};
```

---

### 2. Subscription Panel

```typescript
// apps/web/src/components/SubscriptionPanel.tsx

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/date';

export const SubscriptionPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    subscription,
    billingHistory,
    openPortal,
    cancelSubscription,
    isLoading,
  } = useSubscription();

  if (!user) return null;

  return (
    <div className="subscription-panel">
      <div className="current-plan">
        <h3>Текущий план</h3>
        <div className="plan-badge">
          {user.plan.toUpperCase()}
          {user.subscriptionStatus === 'trialing' && (
            <span className="trial-badge">Триал</span>
          )}
        </div>

        {user.plan === 'pro' && user.trialEndsAt && (
          <p className="trial-info">
            Триал до: {formatDate(user.trialEndsAt)}
          </p>
        )}

        {user.plan === 'pro' && user.subscriptionEndsAt && (
          <p className="renewal-info">
            Продление: {formatDate(user.subscriptionEndsAt)}
          </p>
        )}
      </div>

      <div className="plan-actions">
        {user.plan === 'free' && (
          <button className="upgrade-button" onClick={() => navigate('/pricing')}>
            Перейти на PRO
          </button>
        )}

        {user.plan === 'pro' && (
          <>
            <button onClick={openPortal} disabled={isLoading}>
              Управление подпиской
            </button>
            <button
              onClick={cancelSubscription}
              disabled={isLoading}
              className="cancel-button"
            >
              Отменить подписку
            </button>
          </>
        )}
      </div>

      <div className="billing-history">
        <h3>История платежей</h3>
        {billingHistory.length === 0 ? (
          <p>Нет платежей</p>
        ) : (
          <ul>
            {billingHistory.map((invoice) => (
              <li key={invoice.id}>
                <span>{formatDate(invoice.createdAt)}</span>
                <span>
                  ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                </span>
                <span className={`status ${invoice.status}`}>
                  {invoice.status}
                </span>
                {invoice.invoiceUrl && (
                  <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer">
                    Счет
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
```

---

## Панель администратора

### 1. Admin Dashboard

```typescript
// apps/web/src/pages/admin/Dashboard.tsx

import React from 'react';
import { useAdminStats } from '../../hooks/useAdminStats';

export const AdminDashboard: React.FC = () => {
  const { stats, isLoading } = useAdminStats();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Панель администратора</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Всего пользователей</h3>
          <p className="stat-value">{stats.totalUsers}</p>
        </div>

        <div className="stat-card">
          <h3>PRO подписок</h3>
          <p className="stat-value">{stats.proUsers}</p>
        </div>

        <div className="stat-card">
          <h3>На триале</h3>
          <p className="stat-value">{stats.trialUsers}</p>
        </div>

        <div className="stat-card">
          <h3>MRR</h3>
          <p className="stat-value">${stats.mrr}</p>
        </div>

        <div className="stat-card">
          <h3>ARR</h3>
          <p className="stat-value">${stats.arr}</p>
        </div>

        <div className="stat-card">
          <h3>Churn Rate</h3>
          <p className="stat-value">{stats.churnRate}%</p>
        </div>
      </div>

      <div className="admin-sections">
        <PromoCodeManager />
        <UserManagement />
        <BillingOverview />
      </div>
    </div>
  );
};
```

---

### 2. Promo Code Manager

```typescript
// apps/web/src/components/admin/PromoCodeManager.tsx

import React, { useState } from 'react';
import { usePromoCodes } from '../../hooks/usePromoCodes';

export const PromoCodeManager: React.FC = () => {
  const { promoCodes, createPromoCode, deletePromoCode } = usePromoCodes();
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'discount',
    discountPercent: 20,
    discountMonths: 12,
    maxUses: null,
    expiresAt: null,
  });

  const handleCreate = async () => {
    await createPromoCode(formData);
    setShowForm(false);
  };

  return (
    <div className="promo-code-manager">
      <div className="header">
        <h2>Промокоды</h2>
        <button onClick={() => setShowForm(true)}>Создать промокод</button>
      </div>

      {showForm && (
        <div className="promo-form">
          <input
            placeholder="Код (напр. BETA2025)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />

          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="discount">Скидка</option>
            <option value="beta">Бета-доступ</option>
            <option value="trial_extension">Продление триала</option>
          </select>

          {formData.type === 'discount' && (
            <>
              <input
                type="number"
                placeholder="Процент скидки"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercent: parseInt(e.target.value),
                  })
                }
              />
              <input
                type="number"
                placeholder="Количество месяцев"
                value={formData.discountMonths}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountMonths: parseInt(e.target.value),
                  })
                }
              />
            </>
          )}

          <button onClick={handleCreate}>Создать</button>
          <button onClick={() => setShowForm(false)}>Отмена</button>
        </div>
      )}

      <table className="promo-table">
        <thead>
          <tr>
            <th>Код</th>
            <th>Тип</th>
            <th>Использований</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {promoCodes.map((promo) => (
            <tr key={promo.id}>
              <td>
                <code>{promo.code}</code>
              </td>
              <td>{promo.type}</td>
              <td>
                {promo.currentUses} / {promo.maxUses || '∞'}
              </td>
              <td>
                <span className={promo.isActive ? 'active' : 'inactive'}>
                  {promo.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </td>
              <td>
                <button onClick={() => deletePromoCode(promo.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Промокоды и бета-доступ

### Типы промокодов

**1. Discount (Скидка)**
- Процент скидки: 10-100%
- Длительность: N месяцев
- Пример: `LAUNCH50` - 50% на 3 месяца

**2. Beta Access (Бета-доступ)**
- Дает пожизненный бета-доступ
- Без ограничений
- Пример: `BETA_TESTER_2025`

**3. Trial Extension (Продление триала)**
- Добавляет дни к триалу
- Пример: `EXTRA30` - +30 дней триала

### Создание промокодов

```typescript
// Пример создания бета-кода
await prisma.promoCode.create({
  data: {
    code: 'BETA_TESTER_2025',
    description: 'Beta tester lifetime access',
    type: 'beta',
    grantsBetaAccess: true,
    maxUses: 100,
    isActive: true,
  },
});

// Пример скидочного кода
await prisma.promoCode.create({
  data: {
    code: 'LAUNCH50',
    description: '50% off for 3 months',
    type: 'discount',
    discountPercent: 50,
    discountMonths: 3,
    maxUses: null, // unlimited
    isActive: true,
    expiresAt: new Date('2025-12-31'),
  },
});
```

---

## Безопасность и compliance

### 1. PCI DSS Compliance

**Stripe заботится о:**
- Хранение карточных данных
- Обработка платежей
- PCI DSS сертификация

**Нам НЕ нужно:**
- Хранить карточные данные
- Обрабатывать CVV/CVC
- Проходить PCI сертификацию

### 2. GDPR Compliance

**Данные, которые мы храним:**
- Email (для счетов)
- Имя (для счетов)
- История платежей

**Права пользователя:**
- Экспорт данных
- Удаление аккаунта
- Отписка от email

### 3. Webhook Security

```typescript
// Всегда проверяем подпись webhook
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.rawBody,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

## Тестирование

### 1. Unit тесты

```typescript
// apps/api/src/tests/subscription.service.test.ts

describe('SubscriptionService', () => {
  describe('hasProAccess', () => {
    it('должен вернуть true для beta пользователя', async () => {
      const user = await createTestUser({ plan: 'beta' });
      const hasAccess = await subscriptionService.hasProAccess(user.id);
      expect(hasAccess).toBe(true);
    });

    it('должен вернуть true для active PRO', async () => {
      const user = await createTestUser({
        plan: 'pro',
        subscriptionStatus: 'active',
      });
      const hasAccess = await subscriptionService.hasProAccess(user.id);
      expect(hasAccess).toBe(true);
    });

    it('должен вернуть false для free', async () => {
      const user = await createTestUser({ plan: 'free' });
      const hasAccess = await subscriptionService.hasProAccess(user.id);
      expect(hasAccess).toBe(false);
    });
  });

  describe('checkProjectLimit', () => {
    it('должен вернуть true если лимит не достигнут', async () => {
      const user = await createTestUser({ plan: 'free' });
      // free plan = 10 projects max
      await createTestProjects(user.id, 5);

      const canCreate = await subscriptionService.checkProjectLimit(user.id);
      expect(canCreate).toBe(true);
    });

    it('должен вернуть false при достижении лимита', async () => {
      const user = await createTestUser({ plan: 'free' });
      await createTestProjects(user.id, 10);

      const canCreate = await subscriptionService.checkProjectLimit(user.id);
      expect(canCreate).toBe(false);
    });
  });
});
```

---

### 2. Integration тесты

```typescript
// apps/api/src/tests/stripe.routes.test.ts

describe('Stripe Routes', () => {
  describe('POST /webhooks/stripe', () => {
    it('должен обработать subscription.created', async () => {
      const event = createStripeEvent('customer.subscription.created', {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'trialing',
        metadata: { userId: testUser.id },
        trial_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      });

      const response = await request(app.server)
        .post('/webhooks/stripe')
        .set('stripe-signature', generateSignature(event))
        .send(event)
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(user?.plan).toBe('pro');
      expect(user?.subscriptionStatus).toBe('trialing');
    });

    it('должен обработать invoice.payment_succeeded', async () => {
      const event = createStripeEvent('invoice.payment_succeeded', {
        id: 'in_123',
        customer: testUser.stripeCustomerId,
        amount_paid: 999,
        currency: 'usd',
      });

      await request(app.server)
        .post('/webhooks/stripe')
        .set('stripe-signature', generateSignature(event))
        .send(event)
        .expect(200);

      const billing = await prisma.billingHistory.findFirst({
        where: { userId: testUser.id },
      });

      expect(billing).toBeTruthy();
      expect(billing?.amount).toBe(999);
      expect(billing?.status).toBe('paid');
    });
  });
});
```

---

### 3. E2E тесты (Playwright)

```typescript
// apps/web/e2e/subscription.spec.ts

test.describe('Subscription Flow', () => {
  test('пользователь может подписаться на PRO', async ({ page }) => {
    await page.goto('/pricing');

    // Кликаем на "Start Trial"
    await page.click('text=Start 30-day trial');

    // Должен перенаправить на Stripe Checkout
    await page.waitForURL(/checkout.stripe.com/);

    // Заполняем тестовые данные карты
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="cardExpiry"]', '12/34');
    await page.fill('[name="cardCvc"]', '123');
    await page.fill('[name="billingName"]', 'Test User');

    // Подтверждаем
    await page.click('text=Start trial');

    // Должен вернуться на success страницу
    await page.waitForURL(/\/billing\/success/);

    // Проверяем что план обновился
    await page.goto('/billing');
    await expect(page.locator('text=PRO')).toBeVisible();
    await expect(page.locator('text=Триал')).toBeVisible();
  });

  test('пользователь может применить промокод', async ({ page }) => {
    await page.goto('/pricing');

    // Вводим промокод
    await page.fill('[placeholder="Promo code"]', 'BETA_TESTER_2025');
    await page.click('text=Apply');

    // Должно показать сообщение об успехе
    await expect(page.locator('text=Beta access granted')).toBeVisible();

    // Проверяем что план изменился на beta
    await page.goto('/billing');
    await expect(page.locator('text=BETA')).toBeVisible();
  });

  test('пользователь может отменить подписку', async ({ page }) => {
    // Предполагаем что пользователь уже на PRO
    await page.goto('/billing');

    await page.click('text=Отменить подписку');

    // Подтверждаем
    await page.click('text=Да, отменить');

    // Должно показать что подписка отменена
    await expect(
      page.locator('text=Подписка будет отменена')
    ).toBeVisible();
  });
});
```

---

### 4. Тестирование Stripe в development

**Test Cards:**
```
4242424242424242 - Success
4000000000009995 - Declined
4000000000000341 - Attach fails
4000002500003155 - 3D Secure required
```

**Stripe CLI для webhook тестирования:**
```bash
# Установка
brew install stripe/stripe-cli/stripe

# Логин
stripe login

# Прослушивание webhook (forwarding на localhost)
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger события вручную
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## Оценка времени и стоимости

### Разбивка по задачам

| Задача | Время | Сложность | Описание |
|--------|-------|-----------|----------|
| **1. Stripe аккаунт и настройка** | 2 часа | Легко | Регистрация, создание products, настройка webhook |
| **2. БД миграции** | 3 часа | Средне | Создание таблиц, миграция, seed данных |
| **3. Stripe Service** | 6 часов | Средне | createCustomer, checkout, portal, cancel |
| **4. Subscription Service** | 4 часа | Средне | Проверка доступа, лимиты, plan logic |
| **5. Webhook Handler** | 8 часов | Сложно | Обработка всех событий, retry logic, logging |
| **6. Plan Limits Middleware** | 3 часа | Легко | Middleware для проверки лимитов |
| **7. API Routes (billing)** | 4 часа | Средне | GET /billing, POST /checkout, etc |
| **8. Pricing Page (Frontend)** | 6 часов | Средне | Дизайн, адаптив, интеграция |
| **9. Subscription Panel** | 5 часов | Средне | Отображение статуса, history, actions |
| **10. Promo Code Input** | 3 часа | Легко | Компонент для ввода промокода |
| **11. Admin Dashboard** | 8 часов | Средне | Stats, graphs, overview |
| **12. Promo Code Manager** | 6 часов | Средне | CRUD для промокодов |
| **13. User Management (Admin)** | 4 часа | Средне | Список пользователей, поиск, фильтры |
| **14. Billing Overview (Admin)** | 4 часа | Средне | Revenue stats, failed payments |
| **15. Backend тесты** | 12 часов | Средне | Unit + Integration тесты |
| **16. Frontend тесты** | 8 часов | Средне | Component + E2E тесты |
| **17. Документация** | 4 часа | Легко | API docs, admin guide |
| **18. Тестирование на production** | 6 часов | Средне | Полное тестирование всех сценариев |
| **19. Мониторинг и alerting** | 3 часа | Легко | Настройка оповещений для failed payments |
| **20. Оптимизация и баги** | 8 часов | Средне | Исправление багов, оптимизация |
| **ИТОГО** | **107 часов** | | |

---

### Расчет стоимости

**Исходные данные:**
- Общий бюджет: 120,000 руб
- Cursor IDE Ultra: ~$20/мес ≈ 2,000 руб/мес
- Предполагаемая длительность: 2-3 недели

**Расходы:**
- Cursor IDE Ultra (1 месяц): 2,000 руб
- Разработка (107 часов): 118,000 руб

**Стоимость часа работы:**
118,000 руб / 107 часов ≈ **1,103 руб/час** (или ~$12/час)

---

### График работ (3 недели)

**Неделя 1: Backend Foundation (40 часов)**
- День 1-2: Stripe setup, БД миграции (5 часов)
- День 3-4: Stripe Service + Subscription Service (10 часов)
- День 5-7: Webhook Handler + Plan Limits (11 часов)
- Остаток: API Routes, тесты (14 часов)

**Неделя 2: Frontend + Admin (40 часов)**
- День 1-3: Pricing Page + Subscription Panel (11 часов)
- День 4-5: Promo Code функционал (3 часа)
- День 6-7: Admin Dashboard (8 часов)
- Остаток: Admin panels, интеграция (18 часов)

**Неделя 3: Testing + Polish (27 часов)**
- День 1-2: Backend тесты (12 часов)
- День 3-4: Frontend тесты (8 часов)
- День 5: Production тестирование (6 часов)
- День 6-7: Документация, баги (5 часов + buffer)

---

### Дополнительные затраты

**Сервисы (месячные):**
- Stripe: $0 (до $1M/год в обороте)
- Stripe Connect (если нужен): $2 за аккаунт
- Email сервис (для уведомлений): $10-20/мес

**Один раз:**
- SSL сертификат: Бесплатно (Let's Encrypt)
- Домен: ~$12/год

---

### Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Проблемы с webhook delivery | Средняя | Stripe CLI для тестирования, retry logic |
| Failed payments | Высокая | Автоматические email, grace period |
| Fraund | Низкая | Stripe Radar (встроенная защита) |
| Refunds/Chargebacks | Средняя | Четкие ToS, responsive support |
| GDPR нарушения | Низкая | Privacy policy, data export/delete |

---

### Метрики успеха

**После запуска отслеживать:**
- Conversion rate (Free → PRO)
- Trial-to-paid conversion
- Churn rate (ежемесячный)
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)

**Целевые показатели (через 3 месяца):**
- Trial-to-paid: >30%
- Monthly churn: <5%
- MRR growth: +20% month-over-month

---

## Заключение

**Что будет реализовано:**
1. ✅ Полная интеграция Stripe (checkout, subscriptions, webhooks)
2. ✅ 3 тарифных плана (FREE, PRO, BETA)
3. ✅ 30-дневный триал для PRO
4. ✅ Система промокодов (скидки, бета-доступ, продление триала)
5. ✅ Панель управления подпиской для пользователей
6. ✅ Админ панель (stats, promo codes, users, billing)
7. ✅ Автоматическая обработка платежей и webhook
8. ✅ Комплексное тестирование (unit, integration, E2E)
9. ✅ Документация и мониторинг

**Время:** 107 часов (≈ 3 недели)

**Стоимость:** 120,000 руб (включая Cursor IDE Ultra)

**Часовая ставка:** 1,103 руб/час

---

**Дата создания:** 06.12.2025  
**Версия:** 1.0  
**Статус:** Готово к реализации


