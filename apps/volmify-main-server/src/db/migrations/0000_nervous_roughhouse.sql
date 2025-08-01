CREATE TYPE "public"."change_freq" AS ENUM('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never');--> statement-breakpoint
CREATE TYPE "public"."seo_status" AS ENUM('draft', 'review', 'approved', 'published', 'needs_update');--> statement-breakpoint
CREATE TYPE "public"."org_employee_base_role" AS ENUM('admin');--> statement-breakpoint
CREATE TYPE "public"."org_employee_status" AS ENUM('active', 'terminated', 'leave', 'resigned', 'fired', 'retired', 'invited', 'suspended', 'removed', 'pending_application');--> statement-breakpoint
CREATE TYPE "public"."org_employee_invitation_status" AS ENUM('pending', 'under_review', 'declined', 'cancelled', 'revoked', 'approved', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."org_member_base_role" AS ENUM('owner', 'member', 'employee');--> statement-breakpoint
CREATE TYPE "public"."org_member_status" AS ENUM('active', 'banned', 'pending', 'none_but_invited_as_employee');--> statement-breakpoint
CREATE TYPE "public"."org_member_invitation_type" AS ENUM('learner', 'customer', 'community_member');--> statement-breakpoint
CREATE TYPE "public"."org_member_invitation_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."org_employee_attribution_compensation_type" AS ENUM('revenue_share', 'flat_fee', 'hourly', 'salary', 'per_course', 'none');--> statement-breakpoint
CREATE TYPE "public"."org_employee_attribution_revenue_basis" AS ENUM('product_ownership', 'job_attribution', 'org_commission', 'platform_fee', 'processing_fee', 'referral_commission');--> statement-breakpoint
CREATE TYPE "public"."org_employee_attribution_revenue_recipient_type" AS ENUM('organization', 'job', 'platform', 'payment_processor', 'tax_authority');--> statement-breakpoint
CREATE TYPE "public"."balance_type" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_business_entity_type" AS ENUM('org_member_order', 'org_employee_payout', 'org_member_refund', 'platform_fee', 'payment_processor', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_context_relationship_type" AS ENUM('beneficiary', 'participant', 'creator', 'viewer', 'administrator');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_context_type" AS ENUM('primary', 'secondary', 'derived', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_employee_context_role" AS ENUM('creator', 'beneficiary', 'processor', 'approver');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_member_context_role" AS ENUM('purchaser', 'refund_recipient', 'participant');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_org_context_role" AS ENUM('revenue', 'expense', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."account_transaction_user_context_access_level" AS ENUM('full', 'summary', 'viewer', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');--> statement-breakpoint
CREATE TYPE "public"."org_lesson_type" AS ENUM('video', 'text', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."org_department_employees_status" AS ENUM('active', 'inactive', 'pending', 'removed');--> statement-breakpoint
CREATE TYPE "public"."org_department_team_relationship_type" AS ENUM('lead', 'collaboration', 'support');--> statement-breakpoint
CREATE TYPE "public"."org_department_type" AS ENUM('department', 'division', 'business_unit', 'office', 'region');--> statement-breakpoint
CREATE TYPE "public"."org_team_employee_role" AS ENUM('admin', 'employee');--> statement-breakpoint
CREATE TYPE "public"."org_team_employee_status" AS ENUM('pending', 'active', 'suspended', 'left');--> statement-breakpoint
CREATE TYPE "public"."org_member_product_course_challenge_rating_history_reason" AS ENUM('updated', 'corrected', 'initial');--> statement-breakpoint
CREATE TYPE "public"."org_member_product_course_enrollment_enrollment_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."org_product_course_level" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."org_discount_applies_to" AS ENUM('product', 'variant', 'collection', 'all');--> statement-breakpoint
CREATE TYPE "public"."org_discount_type" AS ENUM('percentage', 'fixed', 'free_shipping', 'buy_x_get_y');--> statement-breakpoint
CREATE TYPE "public"."org_member_order_payment_status" AS ENUM('pending', 'cancelled', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."org_member_order_status" AS ENUM('pending', 'processing', 'confirmed', 'fulfilled', 'cancelled', 'refunded', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('paymob');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'crypto', 'gift_card', 'store_credit');--> statement-breakpoint
CREATE TYPE "public"."tax_calculation_method" AS ENUM('inclusive', 'exclusive', 'exempt');--> statement-breakpoint
CREATE TYPE "public"."org_billing_interval" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."org_subscription_interval_count_unit" AS ENUM('hours', 'days', 'weeks', 'months', 'quarters', 'years');--> statement-breakpoint
CREATE TYPE "public"."org_subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');--> statement-breakpoint
CREATE TYPE "public"."org_payment_plan_type" AS ENUM('one_time', 'subscription', 'usage_based');--> statement-breakpoint
CREATE TYPE "public"."org_usage_pricing_model" AS ENUM('per_unit', 'tiered', 'volume');--> statement-breakpoint
CREATE TYPE "public"."org_usage_type" AS ENUM('api_calls', 'downloads', 'storage_usage', 'bandwidth_usage', 'course_completions', 'lesson_views', 'processing_time');--> statement-breakpoint
CREATE TYPE "public"."org_product_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."org_product_status" AS ENUM('draft', 'active', 'archived', 'pending_approval', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."org_product_type" AS ENUM('physical', 'digital', 'course', 'service');--> statement-breakpoint
CREATE TYPE "public"."org_tax_rates_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."user_profile_org_membership_affiliation_type" AS ENUM('owner', 'employee', 'contractor', 'guest', 'partner', 'volunteer');--> statement-breakpoint
CREATE TYPE "public"."user_profile_org_membership_connection_method" AS ENUM('other', 'email', 'phone', 'in-person');--> statement-breakpoint
CREATE TYPE "public"."user_profile_type" AS ENUM('main', 'job');--> statement-breakpoint
CREATE TABLE "country" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"iso_code" varchar(32) NOT NULL,
	"iso_code_3" varchar(32) NOT NULL,
	"numeric_code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"native_name" varchar(256),
	"currency_code" varchar(32) NOT NULL,
	"default_locale" varchar(32) NOT NULL,
	"flag_emoji" varchar(32),
	"phone_code" varchar(32) NOT NULL,
	"continent" text,
	"region" text,
	"subregion" text,
	"capital" text,
	"languages" text[],
	"timezones" text[],
	"is_active" boolean DEFAULT true,
	"vat_rate" numeric(5, 4),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "country_iso_code_unique" UNIQUE("iso_code"),
	CONSTRAINT "country_iso_code_3_unique" UNIQUE("iso_code_3")
);
--> statement-breakpoint
CREATE TABLE "currency" (
	"code" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"numeric_code" varchar(32),
	"minor_unit" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true,
	"deleted_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exchange_rate" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"base_currency_code" varchar(32) NOT NULL,
	"target_currency_code" varchar(32) NOT NULL,
	"rate" numeric(16, 8) NOT NULL,
	"source" varchar(64),
	"valid_from" timestamp (3) with time zone NOT NULL,
	"valid_to" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"precision" integer DEFAULT 2,
	"rate_type" text
);
--> statement-breakpoint
CREATE TABLE "locale" (
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"key" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"native_name" varchar(256) NOT NULL,
	"language_code" varchar(32) NOT NULL,
	"country_code" varchar(5),
	"is_active" boolean DEFAULT true,
	"is_rtl" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "org" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"created_by_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"logo" varchar(2096),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "org_currency_settings" (
	"org_id" "bytea" NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"is_default" boolean DEFAULT false,
	"display_format" varchar(64),
	"rounding_mode" text DEFAULT 'round',
	"rounding_increment" numeric(10, 6),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgCurrencySettings_orgId_currencyCode" PRIMARY KEY("org_id","currency_code")
);
--> statement-breakpoint
CREATE TABLE "seo_metadata" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea",
	"is_default" boolean DEFAULT false,
	"status" "seo_status" DEFAULT 'draft',
	"title" varchar(768),
	"description" varchar(1536),
	"keywords" text[],
	"image" text,
	"image_alt" text,
	"canonical_url" varchar(2048),
	"focus_keyword" text,
	"robots" text DEFAULT 'index,follow',
	"priority" numeric(2, 1) DEFAULT '0.5',
	"change_freq" "change_freq" DEFAULT 'weekly',
	"hreflang" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_metadata_alternate_url" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"seo_metadata_id" "bytea",
	"locale_key" varchar(10),
	"hreflang" text NOT NULL,
	"url" varchar(2048) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_metadata_custom_meta" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"seo_metadata_id" "bytea",
	"tag_type" text NOT NULL,
	"tag_key" text NOT NULL,
	"tag_value" text NOT NULL,
	"category" varchar(128),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_metadata_open_graph" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"seo_metadata_id" "bytea",
	"title" varchar(768),
	"description" varchar(1536),
	"image" text,
	"image_alt" text,
	"image_width" integer,
	"image_height" integer,
	"type" text DEFAULT 'website',
	"site_name" varchar(768),
	"url" varchar(2048),
	"type_specific_data" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_structured_data" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"seo_metadata_id" "bytea",
	"schema_type" text NOT NULL,
	"data" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 1,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_metadata_twitter_card" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"seo_metadata_id" "bytea",
	"card" varchar(768) DEFAULT 'summary_large_image',
	"title" varchar(768),
	"description" varchar(1536),
	"image" text,
	"image_alt" text,
	"site" text,
	"creator" varchar(768),
	"card_specific_data" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_locale" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"content_strategy" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_region" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"includes_tax" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_region_i18n" (
	"org_region_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgRegnI18n_orgRegnId_localeKey" PRIMARY KEY("org_region_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_employee" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"member_id" "bytea" NOT NULL,
	"user_job_profile_id" "bytea",
	"display_name" varchar(256) NOT NULL,
	"role" "org_employee_base_role" NOT NULL,
	"hired_at" timestamp (3) with time zone,
	"terminated_at" timestamp (3) with time zone,
	"leave_of_absence_at" timestamp (3) with time zone,
	"resigned_at" timestamp (3) with time zone,
	"fired_at" timestamp (3) with time zone,
	"retired_at" timestamp (3) with time zone,
	"applied_at" timestamp (3) with time zone,
	"approved_at" timestamp (3) with time zone,
	"approved_by_employee_id" "bytea",
	"invited_at" timestamp (3) with time zone,
	"invited_by_id" "bytea",
	"status" "org_employee_status" DEFAULT 'active' NOT NULL,
	"is_salaried" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "org_employee_invitation" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"email" varchar(320) NOT NULL,
	"user_job_profile_id" "bytea",
	"proposed_start_date" date,
	"invited_by" "bytea" NOT NULL,
	"approved_by" "bytea",
	"status" "org_employee_invitation_status" DEFAULT 'pending',
	"welcome_message" varchar(1536),
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_member" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"org_id" "bytea" NOT NULL,
	"user_profile_id" "bytea" NOT NULL,
	"display_name" varchar(256),
	"role" "org_member_base_role" DEFAULT 'member' NOT NULL,
	"status" "org_member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp (3) with time zone,
	"last_active_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_member_invitation" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"email" varchar(256) NOT NULL,
	"type" "org_member_invitation_type" DEFAULT 'learner',
	"welcome_message" varchar(1536),
	"invited_by_member_id" "bytea" NOT NULL,
	"status" "org_member_invitation_status" DEFAULT 'pending',
	"expires_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"role" "org_member_base_role" DEFAULT 'member' NOT NULL,
	"accepted_at" timestamp (3) with time zone,
	"declined_at" timestamp (3) with time zone,
	"member_id" "bytea"
);
--> statement-breakpoint
CREATE TABLE "org_employee_attribution" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"employee_id" "bytea" NOT NULL,
	"product_id" "bytea" NOT NULL,
	"org_id" "bytea" NOT NULL,
	"compensation_type" "org_employee_attribution_compensation_type" DEFAULT 'revenue_share',
	"compensation_amount" numeric(12, 4),
	"revenue_share_percentage" numeric(5, 4),
	"revenue_amount" numeric(12, 4),
	"share_percentage" numeric(5, 4),
	"paid_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_employee_attribution_valid_revenue_share" CHECK ("org_employee_attribution"."revenue_share_percentage" IS NULL OR ("org_employee_attribution"."revenue_share_percentage" >= 0 AND "org_employee_attribution"."revenue_share_percentage" <= 100)),
	CONSTRAINT "ck_org_employee_attribution_compensation_consistency" CHECK (
        ("org_employee_attribution"."compensation_type" = 'revenue_share' AND "org_employee_attribution"."revenue_share_percentage" IS NOT NULL) OR
        ("org_employee_attribution"."compensation_type" != 'revenue_share' AND "org_employee_attribution"."compensation_amount" IS NOT NULL)
				)
);
--> statement-breakpoint
CREATE TABLE "org_employee_attribution_revenue" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"order_item_id" "bytea" NOT NULL,
	"recipient_type" "org_employee_attribution_revenue_recipient_type" NOT NULL,
	"attributed_employee_id" "bytea" NOT NULL,
	"platform_recipient" varchar(128),
	"revenue_amount" numeric(12, 4) NOT NULL,
	"revenue_share" numeric(5, 4),
	"attribution_basis" "org_employee_attribution_revenue_basis" NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_employee_attribution_revenue_positive_revenue" CHECK ("org_employee_attribution_revenue"."revenue_amount" >= 0),
	CONSTRAINT "ck_org_employee_attribution_revenue_valid_percentage" CHECK ("org_employee_attribution_revenue"."revenue_share" IS NULL OR ("org_employee_attribution_revenue"."revenue_share" >= 0 AND "org_employee_attribution_revenue"."revenue_share" <= 100))
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"name" varchar(256) NOT NULL,
	"description" varchar(1536) NOT NULL,
	"type" "account_type" NOT NULL,
	"current_balance" numeric(12, 4) DEFAULT '0.00',
	"normal_balance" "balance_type" NOT NULL,
	"org_id" "bytea",
	"member_id" "bytea",
	"currency_code" varchar(32) NOT NULL,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "account_balance_snapshot" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"account_id" "bytea" NOT NULL,
	"snapshot_date" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"balance" numeric(12, 4) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "ck_accountBalanceSnapshot_validBalance" CHECK ("account_balance_snapshot"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "account_transaction" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea",
	"reference" varchar(384) NOT NULL,
	"transaction_number" varchar(32) NOT NULL,
	"transaction_date" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"description" varchar(1536) NOT NULL,
	"total_amount" numeric(12, 4) NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"created_by_employee_id" "bytea",
	"business_entity_type" "account_transaction_business_entity_type",
	"business_entity_id" "bytea"
);
--> statement-breakpoint
CREATE TABLE "account_transaction_context" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"transaction_id" "bytea" NOT NULL,
	"context_type" "account_transaction_context_type" NOT NULL,
	"relationship_type" "account_transaction_context_relationship_type" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "account_transaction_employee_context" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"context_id" "bytea" NOT NULL,
	"employee_id" "bytea" NOT NULL,
	"employee_role" "account_transaction_employee_context_role" NOT NULL,
	"attribution_percentage" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "account_transaction_line" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"account_id" "bytea" NOT NULL,
	"transaction_id" "bytea" NOT NULL,
	"normal_balance" "balance_type" NOT NULL,
	"amount" numeric(12, 4) NOT NULL,
	"currency_code" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_transaction_member_context" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"context_id" "bytea" NOT NULL,
	"member_id" "bytea" NOT NULL,
	"member_role" "account_transaction_member_context_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_transaction_org_context" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"context_id" "bytea" NOT NULL,
	"org_id" "bytea" NOT NULL,
	"org_role" "account_transaction_org_context_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_transaction_user_context" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"context_id" "bytea" NOT NULL,
	"user_id" "bytea" NOT NULL,
	"org_id" "bytea",
	"access_level" "account_transaction_user_context_access_level" DEFAULT 'viewer' NOT NULL,
	"access_source" varchar(384)
);
--> statement-breakpoint
CREATE TABLE "contact_info" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"address" text,
	"website" varchar(2048),
	"social_media" jsonb,
	"contact_type" text DEFAULT 'primary',
	"is_primary" boolean DEFAULT false,
	"preferred_contact_method" text DEFAULT 'email',
	"contact_hours" text,
	"notes" text,
	"tags" text[],
	"verified_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"parent_skill_id" "bytea",
	"approved_at" boolean DEFAULT false,
	"applied_by_org_id" "bytea",
	"created_by_org_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_i18n" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"skill_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"seo_metadata_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_brand" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"logo_url" varchar(2048),
	"brand_category" varchar(128),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_brand_metrics" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"brand_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_brand_i18n" (
	"brand_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"story" text,
	"seo_metadata_id" "bytea",
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgBrandI18n_brandId_localeKey" PRIMARY KEY("brand_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_funnel" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_funnel_domain" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"funnel_id" "bytea" NOT NULL,
	"domain" varchar(255) NOT NULL,
	"is_custom_domain" boolean DEFAULT false NOT NULL,
	"is_subdomain" boolean DEFAULT true NOT NULL,
	"is_canonical" boolean DEFAULT false NOT NULL,
	"is_managed_dns" boolean DEFAULT true NOT NULL,
	"region_id" "bytea",
	"ssl_enabled" boolean DEFAULT false NOT NULL,
	"dns_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(64),
	"is_preview" boolean DEFAULT false NOT NULL,
	"has_custom_404" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_funnel_i18n" (
	"funnel_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgFunnelI18n_funnelId_localeKey" PRIMARY KEY("funnel_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_funnel_region" (
	"funnel_id" "bytea" NOT NULL,
	"region_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgFunnelRegn_funnelId_regnId" PRIMARY KEY("funnel_id","region_id")
);
--> statement-breakpoint
CREATE TABLE "org_lesson" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"type" "org_lesson_type" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_lesson_i18n" (
	"lesson_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea",
	"title" varchar(768) NOT NULL,
	"description" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgLessonI18n_lessonId_localeKey" PRIMARY KEY("lesson_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_department" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"parent_id" "bytea",
	"allows_cross_department_employees" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_department_employees" (
	"employee_id" "bytea" NOT NULL,
	"department_id" "bytea" NOT NULL,
	"status" "org_department_employees_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp (3) with time zone DEFAULT now(),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgDeptEmployees_empId_deptId" PRIMARY KEY("employee_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "org_department_i18n" (
	"department_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgDeptI18n_deptId_localeKey" PRIMARY KEY("department_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_department_team" (
	"department_id" "bytea" NOT NULL,
	"team_id" "bytea" NOT NULL,
	"relationship_type" "org_department_team_relationship_type" DEFAULT 'collaboration' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgDeptTm_tmId_deptId" PRIMARY KEY("team_id","department_id")
);
--> statement-breakpoint
CREATE TABLE "org_team" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"created_by_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"org_id" "bytea" NOT NULL,
	"team_type" text DEFAULT 'cross_functional',
	"allows_cross_department_employees" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "org_team_employee" (
	"employee_id" "bytea" NOT NULL,
	"team_id" "bytea" NOT NULL,
	"status" "org_team_employee_status" DEFAULT 'pending' NOT NULL,
	"role" "org_team_employee_role" DEFAULT 'employee' NOT NULL,
	"joined_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgTmEmp_tmId_empId" PRIMARY KEY("team_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "org_team_i18n" (
	"team_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgTmI18n_tmId_localeKey" PRIMARY KEY("team_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_member_learning_profile" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"member_id" "bytea" NOT NULL,
	"total_courses_completed" integer DEFAULT 0,
	"total_learning_in_minutes" integer DEFAULT 0,
	"total_certificates_earned" integer DEFAULT 0,
	"acquired_skills" jsonb,
	"learning_metadata" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "org_member_learning_profile_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "org_member_product_course_challenge_rating" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"course_id" "bytea" NOT NULL,
	"member_id" "bytea" NOT NULL,
	"level_rating_total" integer DEFAULT 0,
	"level_rating_count" integer DEFAULT 0,
	"level_rating_avg" numeric(3, 2) DEFAULT '0.00',
	"difficulty_rating_total" integer DEFAULT 0,
	"difficulty_rating_count" integer DEFAULT 0,
	"difficulty_rating_avg" numeric(3, 2) DEFAULT '0.00',
	"feedback" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_member_product_course_challenge_rating_history" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"rating_id" "bytea",
	"previous_level_rating" integer,
	"previous_difficulty_rating" integer,
	"previous_feedback" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"reason" "org_member_product_course_challenge_rating_history_reason"
);
--> statement-breakpoint
CREATE TABLE "org_member_product_course_enrollment" (
	"member_id" "bytea" NOT NULL,
	"course_id" "bytea" NOT NULL,
	"status" "org_member_product_course_enrollment_enrollment_status" DEFAULT 'not_started' NOT NULL,
	"progress_percentage" numeric(5, 2) DEFAULT '0.00',
	"completed_at" timestamp (3) with time zone,
	"first_access_at" timestamp,
	"last_accessed_at" timestamp (3) with time zone,
	"total_time_spent_seconds" integer DEFAULT 0,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgMbrProdCourseEnrollment_mbrId_courseId" PRIMARY KEY("member_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "org_product_course" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"product_id" "bytea" NOT NULL,
	"estimated_duration_in_minutes" integer DEFAULT 0 NOT NULL,
	"level" "org_product_course_level" DEFAULT 'beginner' NOT NULL,
	"difficulty" integer DEFAULT 5,
	"user_level_rating_total" integer DEFAULT 0,
	"user_level_rating_count" integer DEFAULT 0,
	"user_level_rating_avg" numeric(3, 2) DEFAULT '0.00',
	"user_difficulty_rating_total" integer DEFAULT 0,
	"user_difficulty_rating_count" integer DEFAULT 0,
	"user_difficulty_rating_avg" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_course_i18n" (
	"course_id" "bytea" NOT NULL,
	"prerequisites" text[],
	"target_audience" text,
	"completion_criteria" text,
	"learning_outcomes" text[],
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdCourseI18n_courseId_localeKey" PRIMARY KEY("course_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"course_id" "bytea" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required_access_tier" integer DEFAULT 1,
	"is_required" boolean DEFAULT true,
	"estimated_duration_in_minutes" integer,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_product_course_module_required_access_tier_range" CHECK ("org_product_course_module"."required_access_tier" >= 0),
	CONSTRAINT "ck_org_product_course_module_sort_order_range" CHECK ("org_product_course_module"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module_i18n" (
	"moduleId" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" text,
	"seo_metadata_id" "bytea",
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdCourseModuleI18n_moduleId_localeKey" PRIMARY KEY("moduleId","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module_section" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"module_id" "bytea" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required_access_tier" integer DEFAULT 1,
	"is_required" boolean DEFAULT true,
	"estimated_duration_in_minutes" integer,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_product_course_module_section_required_access_tier_range" CHECK ("org_product_course_module_section"."required_access_tier" >= 0),
	CONSTRAINT "ck_org_product_course_module_section_sort_order_range" CHECK ("org_product_course_module_section"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module_section_i18n" (
	"section_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" text,
	"seo_metadata_id" "bytea",
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdCourseModuleSectionI18n_sectionId_localeKey" PRIMARY KEY("section_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module_section_lesson" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"section_id" "bytea" NOT NULL,
	"lesson_id" "bytea" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required_access_tier" integer DEFAULT 1,
	"prerequisites" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_product_course_module_section_lesson_required_access_tier_range" CHECK ("org_product_course_module_section_lesson"."required_access_tier" >= 0),
	CONSTRAINT "ck_org_product_course_module_section_lesson_sort_order_range" CHECK ("org_product_course_module_section_lesson"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "org_product_course_module_section_lesson_i18n" (
	"lesson_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea",
	"title" varchar(768) NOT NULL,
	"description" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdCourseModuleSectionLessonI18n_b01b14da" PRIMARY KEY("lesson_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_course_skill" (
	"course_id" "bytea" NOT NULL,
	"skill_id" "bytea" NOT NULL,
	"weight" integer DEFAULT 5,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "ck_org_product_course_skill_weight_range" CHECK ("org_product_course_skill"."weight" >= 1 AND "org_product_course_skill"."weight" <= 10)
);
--> statement-breakpoint
CREATE TABLE "org_product_collection" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"description" text,
	"image" text,
	"deleted_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_collection_product" (
	"product_id" "bytea" NOT NULL,
	"collection_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgProdCollProd_prodId_collId" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "org_coupon" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"discount_id" "bytea" NOT NULL,
	"code" varchar(32) NOT NULL,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp (3) with time zone,
	"ends_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_coupon_i18n" (
	"coupon_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgCouponI18n_couponId_localeKey" PRIMARY KEY("coupon_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_discount" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"type" "org_discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"currency_code" varchar(32),
	"applies_to" "org_discount_applies_to" DEFAULT 'all' NOT NULL,
	"is_active" boolean DEFAULT true,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"starts_at" timestamp (3) with time zone,
	"ends_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_discount_i18n" (
	"discount_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgDiscountI18n_discountId_localeKey" PRIMARY KEY("discount_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_discount_product" (
	"discount_id" "bytea" NOT NULL,
	"product_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgDiscountProd_discountId_prodId" PRIMARY KEY("discount_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "org_discount_product_collection" (
	"discount_id" "bytea" NOT NULL,
	"collection_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgDiscountProdColl_discountId_collId" PRIMARY KEY("discount_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "org_discount_product_variant" (
	"discount_id" "bytea" NOT NULL,
	"variant_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgDiscountProdVar_discountId_varId" PRIMARY KEY("discount_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "org_gift_card" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"code" varchar(32) NOT NULL,
	"balance" numeric(12, 4) NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"issued_by_employee_id" "bytea" NOT NULL,
	"issued_to_member_id" "bytea",
	"issued_to_email" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp (3) with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_gift_card_i18n" (
	"gift_card_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgGiftCardI18n_giftCardId_localeKey" PRIMARY KEY("gift_card_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_member_gift_card_usage" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"member_id" "bytea" NOT NULL,
	"gift_card_id" "bytea" NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"amount_used" numeric(10, 2) NOT NULL,
	"order_id" "bytea",
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_member_discount_usage" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"member_id" "bytea" NOT NULL,
	"discount_id" "bytea" NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"order_id" "bytea",
	"amount_discounted" numeric(10, 2),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_promotion" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"slug" text NOT NULL,
	"banner_image" text,
	"starts_at" timestamp (3) with time zone,
	"ends_at" timestamp (3) with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_promotion_discount" (
	"promotion_id" "bytea" NOT NULL,
	"discount_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgPromotionDiscount_promotionId_discountId" PRIMARY KEY("promotion_id","discount_id")
);
--> statement-breakpoint
CREATE TABLE "org_promotion_i18n" (
	"promotion_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgPromotionI18n_promotionId_localeKey" PRIMARY KEY("promotion_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_member_order" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"display_id" varchar(32) NOT NULL,
	"org_id" "bytea" NOT NULL,
	"member_id" "bytea" NOT NULL,
	"status" "org_member_order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_amount" numeric(12, 4) NOT NULL,
	"discount_amount" numeric(12, 4) DEFAULT '0.00',
	"total_tax_amount" numeric(12, 4) DEFAULT '0.00',
	"total_amount" numeric(12, 4) NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"external_payment_id" varchar(32),
	"payment_method" varchar(128),
	"ordered_at" timestamp (3) with time zone DEFAULT now(),
	"paid_at" timestamp (3) with time zone,
	"fulfilled_at" timestamp (3) with time zone,
	"metadata" jsonb,
	"tier_price" numeric(12, 4) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "ck_org_member_order_total_amount_calculation" CHECK ("org_member_order"."total_amount" = "org_member_order"."subtotal_amount" - "org_member_order"."discount_amount" + "org_member_order"."total_tax_amount"),
	CONSTRAINT "ck_org_member_order_positive_amounts" CHECK ("org_member_order"."subtotal_amount" >= 0 AND "org_member_order"."discount_amount" >= 0 AND "org_member_order"."total_tax_amount" >= 0),
	CONSTRAINT "ck_org_member_order_valid_payment_timing" CHECK ("org_member_order"."paid_at" IS NULL OR "org_member_order"."paid_at" >= "org_member_order"."ordered_at"),
	CONSTRAINT "ck_org_member_order_valid_fulfillment_timing" CHECK ("org_member_order"."fulfilled_at" IS NULL OR "org_member_order"."fulfilled_at" >= "org_member_order"."ordered_at")
);
--> statement-breakpoint
CREATE TABLE "org_member_order_discount" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"order_id" "bytea" NOT NULL,
	"discount_id" "bytea",
	"coupon_id" "bytea",
	"gift_card_id" "bytea",
	"discount_amount" numeric(12, 4) NOT NULL,
	"discount_type" varchar(128) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_member_order_discount_positive_discount" CHECK ("org_member_order_discount"."discount_amount" >= 0),
	CONSTRAINT "ck_org_member_order_discount_single_discount_source" CHECK (("org_member_order_discount"."discount_id" IS NOT NULL)::int + ("org_member_order_discount"."coupon_id" IS NOT NULL)::int + ("org_member_order_discount"."gift_card_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "org_member_order_item" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"order_id" "bytea" NOT NULL,
	"product_id" "bytea" NOT NULL,
	"variant_id" "bytea" NOT NULL,
	"payment_plan_id" "bytea" NOT NULL,
	"selected_access_tier" integer NOT NULL,
	"unit_price" numeric(12, 4) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(12, 4) NOT NULL,
	"total_price" numeric(12, 4) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_member_order_item_positive_quantity" CHECK ("org_member_order_item"."quantity" > 0),
	CONSTRAINT "ck_org_member_order_item_total_price_calculation" CHECK ("org_member_order_item"."total_price" = "org_member_order_item"."unit_price" * "org_member_order_item"."quantity"),
	CONSTRAINT "ck_org_member_order_item_valid_access_tier" CHECK ("org_member_order_item"."selected_access_tier" >= 0)
);
--> statement-breakpoint
CREATE TABLE "org_member_order_payment" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"order_id" "bytea" NOT NULL,
	"payment_gateway" "payment_gateway" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"gateway_transaction_id" varchar(32) NOT NULL,
	"gateway_payment_intent_id" varchar(32),
	"gross_amount" numeric(12, 4) NOT NULL,
	"processing_fee" numeric(12, 4) DEFAULT '0.00',
	"net_amount" numeric(12, 4) NOT NULL,
	"authorized_at" timestamp (3) with time zone,
	"captured_at" timestamp (3) with time zone,
	"settled_at" timestamp (3) with time zone,
	"status" "org_member_order_payment_status" DEFAULT 'pending' NOT NULL,
	"disputed_at" timestamp (3) with time zone,
	"dispute_reason" varchar(128),
	"gateway_response" jsonb,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_member_order_payment_amount_calculation" CHECK ("org_member_order_payment"."net_amount" = "org_member_order_payment"."gross_amount" - "org_member_order_payment"."processing_fee"),
	CONSTRAINT "ck_org_member_order_payment_positive_amounts" CHECK ("org_member_order_payment"."gross_amount" >= 0 AND "org_member_order_payment"."processing_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "org_member_order_tax_calculation" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"order_id" "bytea" NOT NULL,
	"tax_rate_snapshot_id" "bytea",
	"taxable_amount" numeric(12, 4) NOT NULL,
	"calculated_tax_amount" numeric(12, 4) NOT NULL,
	"calculation_method" "tax_calculation_method" NOT NULL,
	"applied_rate" numeric(5, 2) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_member_product_variant_payment_plan_subscription" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_id" "bytea" NOT NULL,
	"plan_id" "bytea" NOT NULL,
	"org_id" "bytea" NOT NULL,
	"member_id" "bytea",
	"status" "org_subscription_status" DEFAULT 'active',
	"access_granted_at" timestamp DEFAULT now(),
	"access_expires_at" timestamp,
	"price" numeric(12, 4) DEFAULT '0',
	"currency_code" varchar(32) NOT NULL,
	"external_metadata" jsonb,
	"external_subscription_id" "bytea",
	"external_customer_id" "bytea",
	"completed_at" timestamp (3) with time zone,
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_payment_plan" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"variant_id" "bytea" NOT NULL,
	"org_id" "bytea" NOT NULL,
	"tax_category_id" "bytea",
	"type" "org_payment_plan_type" NOT NULL,
	"title" varchar(768) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_transferable" boolean DEFAULT false,
	"features" jsonb,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp (3) with time zone DEFAULT now(),
	"valid_to" timestamp (3) with time zone,
	"access_tier" integer DEFAULT 1 NOT NULL,
	"min_quantity" integer DEFAULT 1,
	"max_quantity" integer,
	"allow_gifting" boolean DEFAULT false,
	"completed_at" timestamp (3) with time zone,
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_payment_plan_i18n" (
	"plan_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" text,
	"access_description" text,
	"gift_message" text,
	"transfer_policy" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdVarPaymPlanI18n_planId_localeKey" PRIMARY KEY("plan_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_payment_plan_one_time_type" (
	"plan_id" "bytea" PRIMARY KEY NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"price" numeric(12, 4),
	"max_purchases_per_user" integer,
	"completed_at" timestamp (3) with time zone,
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_payment_plan_subscription_type" (
	"plan_id" "bytea" PRIMARY KEY NOT NULL,
	"currency_code" varchar(32) NOT NULL,
	"price" numeric(12, 4) DEFAULT '0',
	"billing_interval" "org_billing_interval" NOT NULL,
	"custom_billing_interval_count" integer DEFAULT 1,
	"custom_billing_interval_unit" "org_subscription_interval_count_unit" DEFAULT 'months' NOT NULL,
	"trial_period_days" integer DEFAULT 0,
	"completed_at" timestamp (3) with time zone,
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_payment_plan_subscription_type_i18n" (
	"plan_id" "bytea" NOT NULL,
	"billing_description" text,
	"trial_message" text,
	"cancellation_policy" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdVarPaymPlanSubTypeI18n_planId_localeKey" PRIMARY KEY("plan_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"status" "org_product_status" DEFAULT 'draft' NOT NULL,
	"type" "org_product_type" DEFAULT 'physical' NOT NULL,
	"has_pending_approval" boolean DEFAULT false,
	"approved_at" timestamp (3) with time zone,
	"rejected_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_product_approval" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"product_id" "bytea" NOT NULL,
	"submitted_by_employee_id" "bytea" NOT NULL,
	"reviewed_by_employee_id" "bytea",
	"status" "org_product_approval_status" DEFAULT 'pending',
	"notes" text,
	"reviewed_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_product_brand_attribution" (
	"brand_id" "bytea" NOT NULL,
	"product_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgProdBrandAttribution_brandId_prodId" PRIMARY KEY("brand_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "org_product_i18n" (
	"product_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdI18n_prodId_localeKey" PRIMARY KEY("product_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_product_revenue_pool" (
	"product_id" "bytea" PRIMARY KEY NOT NULL,
	"total_allocated_percentage" numeric(5, 2) DEFAULT '0.00',
	"remaining_percentage" numeric(5, 2) DEFAULT '100.00',
	"allocation_history" jsonb,
	"last_allocation_by_employee_id" "bytea",
	"last_allocation_at" timestamp (3) with time zone DEFAULT now(),
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "ck_org_product_revenue_pool_valid_percentages" CHECK ("org_product_revenue_pool"."total_allocated_percentage" + "org_product_revenue_pool"."remaining_percentage" = 100),
	CONSTRAINT "ck_org_product_revenue_pool_non_negative_remaining" CHECK ("org_product_revenue_pool"."remaining_percentage" >= 0),
	CONSTRAINT "ck_orgProductRevenuePoolTableName}_valid_allocated_range" CHECK ("org_product_revenue_pool"."total_allocated_percentage" >= 0 AND "org_product_revenue_pool"."total_allocated_percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "org_product_variant" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"product_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"type" "org_payment_plan_type" NOT NULL,
	"tax_category_id" "bytea" NOT NULL,
	"features" jsonb,
	"starts_at" timestamp (3) with time zone,
	"ends_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "org_product_variant_i18n" (
	"variant_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"title" varchar(768) NOT NULL,
	"description" text,
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgProdVarI18n_varId_localeKey" PRIMARY KEY("variant_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_tax_category" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_tax_category_i18n" (
	"category_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgTaxCatgI18n_catgId_localeKey" PRIMARY KEY("category_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_tax_rates" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"org_id" "bytea" NOT NULL,
	"region_id" "bytea" NOT NULL,
	"is_region_scoped" boolean DEFAULT true NOT NULL,
	"jurisdiction" varchar(128),
	"code" varchar(32) NOT NULL,
	"type" "org_tax_rates_type" DEFAULT 'percent' NOT NULL,
	"rate" numeric(5, 2),
	"amount" numeric(12, 4),
	"currency_code" varchar(32),
	"effective_from" timestamp (3) with time zone NOT NULL,
	"effective_to" timestamp (3) with time zone,
	"is_inclusive" boolean DEFAULT false NOT NULL,
	"modification_version" integer DEFAULT 1 NOT NULL,
	"system_changes_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "ck_org_tax_rates_valid_effective_period" CHECK ("org_tax_rates"."effective_to" IS NULL OR "org_tax_rates"."effective_to" > "org_tax_rates"."effective_from"),
	CONSTRAINT "ck_org_tax_rates_valid_rate_range" CHECK ("org_tax_rates"."rate" >= 0 AND "org_tax_rates"."rate" <= 100)
);
--> statement-breakpoint
CREATE TABLE "org_tax_rates_i18n" (
	"rate_id" "bytea" NOT NULL,
	"seo_metadata_id" "bytea" NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1536),
	"org_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "pk_orgTaxRatesI18n_rateId_localeKey" PRIMARY KEY("rate_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "org_tax_rates_snapshot" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"system_changes_version" integer DEFAULT 0 NOT NULL,
	"modification_version" integer DEFAULT 1 NOT NULL,
	"rate_id" "bytea" NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"by_employee_id" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_tax_rates_tax_category" (
	"rate_id" "bytea" NOT NULL,
	"category_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	CONSTRAINT "pk_orgTaxRatesTaxCatg_rateId_catgId" PRIMARY KEY("rate_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_locale" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"content_strategy" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_job_profile" (
	"user_profile_id" "bytea" PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"verified_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"display_name" varchar(256) NOT NULL,
	"headline" varchar(384) NOT NULL,
	"bio" varchar(1536) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_job_profile_metrics" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_job_profile_id" "bytea" NOT NULL,
	"total" integer DEFAULT 0,
	"rating_total" integer DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"rating_avg" numeric(3, 2) DEFAULT '0.00',
	"reviews_count" integer DEFAULT 0,
	"revenue_generated_total" numeric(12, 4) DEFAULT '0.00',
	"payouts_total" numeric(12, 4) DEFAULT '0.00',
	"students_count" integer DEFAULT 0,
	"completed_by_students_count" integer DEFAULT 0,
	"in_progress_by_students_count" integer DEFAULT 0,
	"courses_total" integer DEFAULT 0,
	"courses_rating_total" integer DEFAULT 0,
	"courses_rating_count" integer DEFAULT 0,
	"courses_rating_avg" numeric(3, 2) DEFAULT '0.00',
	"courses_reviews_count" integer DEFAULT 0,
	"courses_revenue_generated_total" numeric(12, 4) DEFAULT '0.00',
	"courses_payouts_total" numeric(12, 4) DEFAULT '0.00',
	"courses_students_count" integer DEFAULT 0,
	"courses_completed_by_students_count" integer DEFAULT 0,
	"courses_in_progress_by_students_count" integer DEFAULT 0,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_job_profile_skill" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_job_profile_id" "bytea" NOT NULL,
	"skill_id" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profile" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_id" "bytea" NOT NULL,
	"slug" varchar(128) NOT NULL,
	"display_name" varchar(256) NOT NULL,
	"profile_picture_url" varchar(2048),
	"is_active" boolean DEFAULT true,
	"type" "user_profile_type" DEFAULT 'main',
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profile_contact_info" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_profile_id" "bytea" NOT NULL,
	"contact_info_id" "bytea" NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "user_profile_i18n" (
	"user_profile_id" "bytea" NOT NULL,
	"bio" text,
	"seo_metadata_id" "bytea",
	"user_id" "bytea" NOT NULL,
	"locale_key" varchar(10) NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "user_profile_i18n_user_profile_id_locale_key_pk" PRIMARY KEY("user_profile_id","locale_key")
);
--> statement-breakpoint
CREATE TABLE "user_profile_org_membership" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_profile_id" "bytea" NOT NULL,
	"member_id" "bytea" NOT NULL,
	"joined_at" timestamp (3) with time zone DEFAULT now(),
	"approved_at" timestamp (3) with time zone,
	"started_at" timestamp (3) with time zone DEFAULT now(),
	"ended_at" timestamp (3) with time zone,
	"affiliation_type" "user_profile_org_membership_affiliation_type" NOT NULL,
	"connection_method" "user_profile_org_membership_connection_method",
	"application_notes" text,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"deleted_at" timestamp (3) with time zone,
	"last_login_at" timestamp (3),
	"name" varchar(256) NOT NULL,
	"display_name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"email_verified_at" timestamp (3),
	"image" varchar(2096),
	"password_hash" varchar(512),
	"two_factor_enabled_at" timestamp (3),
	"totp_key" "bytea",
	"recovery_code" "bytea",
	"two_factor_registered_at" timestamp (3),
	CONSTRAINT "uq_user_name" UNIQUE("name"),
	CONSTRAINT "uq_user_email" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_email_verification" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"code" varchar(32) NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"email" varchar(256) NOT NULL,
	"user_id" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_password_reset" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"code" varchar(32) NOT NULL,
	"expires_at" timestamp (3) with time zone NOT NULL,
	"email" varchar(256) NOT NULL,
	"user_id" "bytea" NOT NULL,
	"email_verified_at" timestamp (3),
	"two_factor_verified_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now(),
	"last_updated_at" timestamp (3) with time zone DEFAULT now(),
	"expires_at" timestamp (3) with time zone NOT NULL,
	"last_verified_at" timestamp (3) NOT NULL,
	"last_extended_at" timestamp (3),
	"ip_address" varchar(45),
	"user_agent_metadata" jsonb,
	"user_id" "bytea" NOT NULL,
	"two_factor_verified_at" timestamp (3),
	"auth_strategy" varchar(50) DEFAULT 'jwt' NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exchange_rate" ADD CONSTRAINT "fk_exchangeRate_baseCurrencyCode" FOREIGN KEY ("base_currency_code") REFERENCES "public"."currency"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate" ADD CONSTRAINT "fk_exchangeRate_targetCurrencyCode" FOREIGN KEY ("target_currency_code") REFERENCES "public"."currency"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org" ADD CONSTRAINT "fk_org_createdById" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_currency_settings" ADD CONSTRAINT "fk_orgCurrencySettings_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_currency_settings" ADD CONSTRAINT "fk_orgCurrencySettings_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD CONSTRAINT "fk_seoMeta_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata_alternate_url" ADD CONSTRAINT "fk_seoMetaAlternateUrl_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata_custom_meta" ADD CONSTRAINT "fk_seoMetaCustomMeta_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata_open_graph" ADD CONSTRAINT "fk_seoMetaOpenGraph_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_structured_data" ADD CONSTRAINT "fk_seoMetaStructuredData_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_metadata_twitter_card" ADD CONSTRAINT "fk_seoMetaTwitterCard_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_locale" ADD CONSTRAINT "fk_orgLocale_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_locale" ADD CONSTRAINT "fk_orgLocale_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region" ADD CONSTRAINT "fk_orgRegn_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region" ADD CONSTRAINT "fk_orgRegn_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region_i18n" ADD CONSTRAINT "org_region_i18n_org_region_id_org_region_id_fk" FOREIGN KEY ("org_region_id") REFERENCES "public"."org_region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region_i18n" ADD CONSTRAINT "fk_orgRegnI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region_i18n" ADD CONSTRAINT "fk_orgRegnI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region_i18n" ADD CONSTRAINT "fk_orgRegnI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_region_i18n" ADD CONSTRAINT "fk_orgRegnI18n_orgRegnId" FOREIGN KEY ("org_region_id") REFERENCES "public"."org_region"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee" ADD CONSTRAINT "fk_orgEmp_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee" ADD CONSTRAINT "fk_orgEmp_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee" ADD CONSTRAINT "fk_orgEmp_invitedById" FOREIGN KEY ("invited_by_id") REFERENCES "public"."org_employee"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_invitation" ADD CONSTRAINT "fk_orgEmpInvitation_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_invitation" ADD CONSTRAINT "fk_orgEmpInvitation_invitedBy" FOREIGN KEY ("invited_by") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_invitation" ADD CONSTRAINT "fk_orgEmpInvitation_approvedBy" FOREIGN KEY ("approved_by") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_invitation" ADD CONSTRAINT "fk_orgEmpInvitation_userJobProfileId" FOREIGN KEY ("user_job_profile_id") REFERENCES "public"."user_job_profile"("user_profile_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member" ADD CONSTRAINT "fk_orgMbr_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member" ADD CONSTRAINT "fk_orgMbr_userProfileId" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_invitation" ADD CONSTRAINT "fk_orgMbrInvitation_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_invitation" ADD CONSTRAINT "fk_orgMbrInvitation_invitedByMbrId" FOREIGN KEY ("invited_by_member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_attribution" ADD CONSTRAINT "fk_orgEmpAttribution_empId" FOREIGN KEY ("employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_attribution" ADD CONSTRAINT "fk_orgEmpAttribution_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_attribution_revenue" ADD CONSTRAINT "fk_orgEmpAttributionRevu_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_attribution_revenue" ADD CONSTRAINT "fk_orgEmpAttributionRevu_orderItemId" FOREIGN KEY ("order_item_id") REFERENCES "public"."org_member_order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_employee_attribution_revenue" ADD CONSTRAINT "fk_orgEmpAttributionRevu_attributedEmpId" FOREIGN KEY ("attributed_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "fk_account_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "fk_account_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "fk_account_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_balance_snapshot" ADD CONSTRAINT "fk_accountBalanceSnapshot_accountId" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction" ADD CONSTRAINT "fk_accountTxn_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction" ADD CONSTRAINT "fk_accountTxn_createdByEmpId" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction" ADD CONSTRAINT "fk_accountTxn_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_context" ADD CONSTRAINT "fk_accountTxnContext_txnId" FOREIGN KEY ("transaction_id") REFERENCES "public"."account_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_employee_context" ADD CONSTRAINT "fk_accountTxnEmpContext_empId" FOREIGN KEY ("employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_employee_context" ADD CONSTRAINT "fk_accountTxnEmpContext_contextId" FOREIGN KEY ("context_id") REFERENCES "public"."account_transaction_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_line" ADD CONSTRAINT "fk_accountTxnLine_accountId" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_line" ADD CONSTRAINT "fk_accountTxnLine_txnId" FOREIGN KEY ("transaction_id") REFERENCES "public"."account_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_member_context" ADD CONSTRAINT "fk_accountTxnMbrContext_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_member_context" ADD CONSTRAINT "fk_accountTxnMbrContext_contextId" FOREIGN KEY ("context_id") REFERENCES "public"."account_transaction_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_org_context" ADD CONSTRAINT "fk_accountTxnOrgContext_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_org_context" ADD CONSTRAINT "fk_accountTxnOrgContext_contextId" FOREIGN KEY ("context_id") REFERENCES "public"."account_transaction_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_user_context" ADD CONSTRAINT "fk_accountTxnUserContext_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_user_context" ADD CONSTRAINT "fk_accountTxnUserContext_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transaction_user_context" ADD CONSTRAINT "fk_accountTxnUserContext_contextId" FOREIGN KEY ("context_id") REFERENCES "public"."account_transaction_context"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "fk_skill_appliedByOrgId" FOREIGN KEY ("applied_by_org_id") REFERENCES "public"."org"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "fk_skill_createdByOrgId" FOREIGN KEY ("created_by_org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "fk_skill_parentSkillId" FOREIGN KEY ("parent_skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_i18n" ADD CONSTRAINT "fk_skillI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_i18n" ADD CONSTRAINT "fk_skillI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_i18n" ADD CONSTRAINT "fk_skillI18n_skillId" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_brand_metrics" ADD CONSTRAINT "fk_orgBrandMetrics_brandId" FOREIGN KEY ("brand_id") REFERENCES "public"."org_brand"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_brand_i18n" ADD CONSTRAINT "fk_orgBrandI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_brand_i18n" ADD CONSTRAINT "fk_orgBrandI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_brand_i18n" ADD CONSTRAINT "fk_orgBrandI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_brand_i18n" ADD CONSTRAINT "fk_orgBrandI18n_brandId" FOREIGN KEY ("brand_id") REFERENCES "public"."org_brand"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel" ADD CONSTRAINT "fk_orgFunnel_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_domain" ADD CONSTRAINT "fk_orgFunnelDomain_funnelId" FOREIGN KEY ("funnel_id") REFERENCES "public"."org_funnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_domain" ADD CONSTRAINT "fk_orgFunnelDomain_regnId" FOREIGN KEY ("region_id") REFERENCES "public"."org_region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_i18n" ADD CONSTRAINT "fk_orgFunnelI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_i18n" ADD CONSTRAINT "fk_orgFunnelI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_i18n" ADD CONSTRAINT "fk_orgFunnelI18n_funnelId" FOREIGN KEY ("funnel_id") REFERENCES "public"."org_funnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_i18n" ADD CONSTRAINT "fk_orgFunnelI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_region" ADD CONSTRAINT "fk_orgFunnelRegn_funnelId" FOREIGN KEY ("funnel_id") REFERENCES "public"."org_funnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_funnel_region" ADD CONSTRAINT "fk_orgFunnelRegn_regnId" FOREIGN KEY ("region_id") REFERENCES "public"."org_region"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_lesson" ADD CONSTRAINT "fk_orgLesson_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_lesson_i18n" ADD CONSTRAINT "fk_orgLessonI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_lesson_i18n" ADD CONSTRAINT "fk_orgLessonI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_lesson_i18n" ADD CONSTRAINT "fk_orgLessonI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_lesson_i18n" ADD CONSTRAINT "fk_orgLessonI18n_lessonId" FOREIGN KEY ("lesson_id") REFERENCES "public"."org_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department" ADD CONSTRAINT "fk_orgDept_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department" ADD CONSTRAINT "fk_orgDept_parentId" FOREIGN KEY ("parent_id") REFERENCES "public"."org_department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_employees" ADD CONSTRAINT "org_department_employees_department_id_org_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."org_department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_employees" ADD CONSTRAINT "fk_orgDeptEmployees_empId" FOREIGN KEY ("employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_employees" ADD CONSTRAINT "fk_orgDeptEmployees_deptId" FOREIGN KEY ("department_id") REFERENCES "public"."org_department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_i18n" ADD CONSTRAINT "fk_orgDeptI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_i18n" ADD CONSTRAINT "fk_orgDeptI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_i18n" ADD CONSTRAINT "fk_orgDeptI18n_deptId" FOREIGN KEY ("department_id") REFERENCES "public"."org_department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_team" ADD CONSTRAINT "fk_orgDeptTm_deptId" FOREIGN KEY ("department_id") REFERENCES "public"."org_department"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_department_team" ADD CONSTRAINT "fk_orgDeptTm_tmId" FOREIGN KEY ("team_id") REFERENCES "public"."org_team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team" ADD CONSTRAINT "fk_orgTm_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team" ADD CONSTRAINT "fk_orgTm_createdById" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team_employee" ADD CONSTRAINT "fk_orgTmEmp_empId" FOREIGN KEY ("employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team_employee" ADD CONSTRAINT "fk_orgTmEmp_tmId" FOREIGN KEY ("team_id") REFERENCES "public"."org_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team_i18n" ADD CONSTRAINT "fk_orgTmI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team_i18n" ADD CONSTRAINT "fk_orgTmI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_team_i18n" ADD CONSTRAINT "fk_orgTmI18n_tmId" FOREIGN KEY ("team_id") REFERENCES "public"."org_team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_learning_profile" ADD CONSTRAINT "fk_orgMbrLearningProfile_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_course_challenge_rating" ADD CONSTRAINT "fk_orgMbrProdCourseChallengeRating_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_course_challenge_rating" ADD CONSTRAINT "fk_orgMbrProdCourseChallengeRating_courseId" FOREIGN KEY ("course_id") REFERENCES "public"."org_product_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_course_challenge_rating_history" ADD CONSTRAINT "org_member_product_course_challenge_rating_history_rating_id_org_member_product_course_challenge_rating_id_fk" FOREIGN KEY ("rating_id") REFERENCES "public"."org_member_product_course_challenge_rating"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_course_enrollment" ADD CONSTRAINT "fk_orgMbrProdCourseEnrollment_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_course_enrollment" ADD CONSTRAINT "fk_orgMbrProdCourseEnrollment_courseId" FOREIGN KEY ("course_id") REFERENCES "public"."org_product_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course" ADD CONSTRAINT "fk_orgProdCourse_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_i18n" ADD CONSTRAINT "fk_orgProdCourseI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_i18n" ADD CONSTRAINT "fk_orgProdCourseI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_i18n" ADD CONSTRAINT "fk_orgProdCourseI18n_courseId" FOREIGN KEY ("course_id") REFERENCES "public"."org_product_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module" ADD CONSTRAINT "fk_orgProdCourseModule_courseId" FOREIGN KEY ("course_id") REFERENCES "public"."org_product_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleI18n_moduleId" FOREIGN KEY ("moduleId") REFERENCES "public"."org_product_course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section" ADD CONSTRAINT "fk_orgProdCourseModuleSection_moduleId" FOREIGN KEY ("module_id") REFERENCES "public"."org_product_course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionI18n_sectionId" FOREIGN KEY ("section_id") REFERENCES "public"."org_product_course_module_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLesson_sectionId" FOREIGN KEY ("section_id") REFERENCES "public"."org_product_course_module_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLesson_lessonId" FOREIGN KEY ("lesson_id") REFERENCES "public"."org_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLessonI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLessonI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLessonI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_module_section_lesson_i18n" ADD CONSTRAINT "fk_orgProdCourseModuleSectionLessonI18n_lessonId" FOREIGN KEY ("lesson_id") REFERENCES "public"."org_product_course_module_section_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_skill" ADD CONSTRAINT "fk_orgProdCourseSkill_courseId" FOREIGN KEY ("course_id") REFERENCES "public"."org_product_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_course_skill" ADD CONSTRAINT "fk_orgProdCourseSkill_skillId" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_collection" ADD CONSTRAINT "fk_orgProdColl_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_coupon" ADD CONSTRAINT "fk_orgCoupon_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_coupon" ADD CONSTRAINT "fk_orgCoupon_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_coupon_i18n" ADD CONSTRAINT "fk_orgCouponI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_coupon_i18n" ADD CONSTRAINT "fk_orgCouponI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_coupon_i18n" ADD CONSTRAINT "fk_orgCouponI18n_couponId" FOREIGN KEY ("coupon_id") REFERENCES "public"."org_coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount" ADD CONSTRAINT "fk_orgDiscount_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount" ADD CONSTRAINT "fk_orgDiscount_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_i18n" ADD CONSTRAINT "fk_orgDiscountI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_i18n" ADD CONSTRAINT "fk_orgDiscountI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_i18n" ADD CONSTRAINT "fk_orgDiscountI18n_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product" ADD CONSTRAINT "fk_orgDiscountProd_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product" ADD CONSTRAINT "fk_orgDiscountProd_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product_collection" ADD CONSTRAINT "fk_orgDiscountProdColl_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product_collection" ADD CONSTRAINT "fk_orgDiscountProdColl_collId" FOREIGN KEY ("collection_id") REFERENCES "public"."org_product_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product_variant" ADD CONSTRAINT "fk_orgDiscountProdVar_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discount_product_variant" ADD CONSTRAINT "fk_orgDiscountProdVar_varId" FOREIGN KEY ("variant_id") REFERENCES "public"."org_product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card" ADD CONSTRAINT "fk_orgGiftCard_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card" ADD CONSTRAINT "fk_orgGiftCard_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card" ADD CONSTRAINT "fk_orgGiftCard_issuedByEmpId" FOREIGN KEY ("issued_by_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card" ADD CONSTRAINT "fk_orgGiftCard_issuedToMbrId" FOREIGN KEY ("issued_to_member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card_i18n" ADD CONSTRAINT "fk_orgGiftCardI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card_i18n" ADD CONSTRAINT "fk_orgGiftCardI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_gift_card_i18n" ADD CONSTRAINT "fk_orgGiftCardI18n_giftCardId" FOREIGN KEY ("gift_card_id") REFERENCES "public"."org_gift_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_gift_card_usage" ADD CONSTRAINT "org_member_gift_card_usage_gift_card_id_org_gift_card_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."org_gift_card"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_gift_card_usage" ADD CONSTRAINT "fk_orgMbrGiftCardUsage_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_gift_card_usage" ADD CONSTRAINT "fk_orgMbrGiftCardUsage_giftCardId" FOREIGN KEY ("gift_card_id") REFERENCES "public"."org_gift_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_gift_card_usage" ADD CONSTRAINT "fk_orgMbrGiftCardUsage_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_discount_usage" ADD CONSTRAINT "fk_orgMbrDiscountUsage_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_discount_usage" ADD CONSTRAINT "fk_orgMbrDiscountUsage_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_discount_usage" ADD CONSTRAINT "fk_orgMbrDiscountUsage_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion" ADD CONSTRAINT "fk_orgPromotion_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion_discount" ADD CONSTRAINT "fk_orgPromotionDiscount_promotionId" FOREIGN KEY ("promotion_id") REFERENCES "public"."org_promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion_discount" ADD CONSTRAINT "fk_orgPromotionDiscount_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion_i18n" ADD CONSTRAINT "fk_orgPromotionI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion_i18n" ADD CONSTRAINT "fk_orgPromotionI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_promotion_i18n" ADD CONSTRAINT "fk_orgPromotionI18n_promotionId" FOREIGN KEY ("promotion_id") REFERENCES "public"."org_promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order" ADD CONSTRAINT "fk_orgMbrOrder_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order" ADD CONSTRAINT "fk_orgMbrOrder_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_discount" ADD CONSTRAINT "fk_orgMbrOrderDiscount_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_discount" ADD CONSTRAINT "fk_orgMbrOrderDiscount_discountId" FOREIGN KEY ("discount_id") REFERENCES "public"."org_discount"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_discount" ADD CONSTRAINT "fk_orgMbrOrderDiscount_couponId" FOREIGN KEY ("coupon_id") REFERENCES "public"."org_coupon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_discount" ADD CONSTRAINT "fk_orgMbrOrderDiscount_giftCardId" FOREIGN KEY ("gift_card_id") REFERENCES "public"."org_gift_card"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_item" ADD CONSTRAINT "fk_orgMbrOrderItem_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_item" ADD CONSTRAINT "fk_orgMbrOrderItem_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_item" ADD CONSTRAINT "fk_orgMbrOrderItem_varId" FOREIGN KEY ("variant_id") REFERENCES "public"."org_product_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_item" ADD CONSTRAINT "fk_orgMbrOrderItem_paymPlanId" FOREIGN KEY ("payment_plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_payment" ADD CONSTRAINT "fk_orgMbrOrderPaym_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_tax_calculation" ADD CONSTRAINT "fk_orgMbrOrderTaxCalculation_orderId" FOREIGN KEY ("order_id") REFERENCES "public"."org_member_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_order_tax_calculation" ADD CONSTRAINT "fk_orgMbrOrderTaxCalculation_taxRateSnapshotId" FOREIGN KEY ("tax_rate_snapshot_id") REFERENCES "public"."org_tax_rates_snapshot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_variant_payment_plan_subscription" ADD CONSTRAINT "fk_orgMbrProdVarPaymPlanSub_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_variant_payment_plan_subscription" ADD CONSTRAINT "fk_orgMbrProdVarPaymPlanSub_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_variant_payment_plan_subscription" ADD CONSTRAINT "fk_orgMbrProdVarPaymPlanSub_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member_product_variant_payment_plan_subscription" ADD CONSTRAINT "fk_orgMbrProdVarPaymPlanSub_planId" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan" ADD CONSTRAINT "fk_orgProdVarPaymPlan_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan" ADD CONSTRAINT "fk_orgProdVarPaymPlan_varId" FOREIGN KEY ("variant_id") REFERENCES "public"."org_product_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "org_product_variant_payment_plan_i18n_plan_id_org_product_variant_payment_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "org_product_variant_payment_plan_i18n_seo_metadata_id_seo_metadata_id_fk" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanI18n_planId" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_one_time_type" ADD CONSTRAINT "fk_orgProdVarPaymPlanOneTimeType_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_one_time_type" ADD CONSTRAINT "fk_orgProdVarPaymPlanOneTimeType_planId" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_subscription_type" ADD CONSTRAINT "fk_orgProdVarPaymPlanSubType_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_subscription_type" ADD CONSTRAINT "fk_orgProdVarPaymPlanSubType_planId" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_subscription_type_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanSubTypeI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_subscription_type_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanSubTypeI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_payment_plan_subscription_type_i18n" ADD CONSTRAINT "fk_orgProdVarPaymPlanSubTypeI18n_planId" FOREIGN KEY ("plan_id") REFERENCES "public"."org_product_variant_payment_plan_subscription_type"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product" ADD CONSTRAINT "fk_orgProd_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_approval" ADD CONSTRAINT "fk_orgProdApproval_submittedByEmpId" FOREIGN KEY ("submitted_by_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_approval" ADD CONSTRAINT "fk_orgProdApproval_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_brand_attribution" ADD CONSTRAINT "fk_orgProdBrandAttribution_brandId" FOREIGN KEY ("brand_id") REFERENCES "public"."org_brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_brand_attribution" ADD CONSTRAINT "fk_orgProdBrandAttribution_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_i18n" ADD CONSTRAINT "fk_orgProdI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_i18n" ADD CONSTRAINT "fk_orgProdI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_i18n" ADD CONSTRAINT "fk_orgProdI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_i18n" ADD CONSTRAINT "fk_orgProdI18n_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_revenue_pool" ADD CONSTRAINT "fk_orgProdRevuPool_lastAllocationByEmpId" FOREIGN KEY ("last_allocation_by_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_revenue_pool" ADD CONSTRAINT "fk_orgProdRevuPool_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant" ADD CONSTRAINT "fk_orgProdVar_prodId" FOREIGN KEY ("product_id") REFERENCES "public"."org_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant" ADD CONSTRAINT "fk_orgProdVar_taxCatgId" FOREIGN KEY ("tax_category_id") REFERENCES "public"."org_tax_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_i18n" ADD CONSTRAINT "fk_orgProdVarI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_i18n" ADD CONSTRAINT "fk_orgProdVarI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_i18n" ADD CONSTRAINT "fk_orgProdVarI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_product_variant_i18n" ADD CONSTRAINT "fk_orgProdVarI18n_varId" FOREIGN KEY ("variant_id") REFERENCES "public"."org_product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_category_i18n" ADD CONSTRAINT "fk_orgTaxCatgI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_category_i18n" ADD CONSTRAINT "fk_orgTaxCatgI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_category_i18n" ADD CONSTRAINT "fk_orgTaxCatgI18n_catgId" FOREIGN KEY ("category_id") REFERENCES "public"."org_tax_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_category_i18n" ADD CONSTRAINT "fk_orgTaxCatgI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates" ADD CONSTRAINT "fk_orgTaxRates_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates" ADD CONSTRAINT "fk_orgTaxRates_currencyCode" FOREIGN KEY ("currency_code") REFERENCES "public"."currency"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates" ADD CONSTRAINT "fk_orgTaxRates_regnId" FOREIGN KEY ("region_id") REFERENCES "public"."org_region"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_i18n" ADD CONSTRAINT "fk_orgTaxRatesI18n_orgId" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_i18n" ADD CONSTRAINT "fk_orgTaxRatesI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_i18n" ADD CONSTRAINT "fk_orgTaxRatesI18n_rateId" FOREIGN KEY ("rate_id") REFERENCES "public"."org_tax_rates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_i18n" ADD CONSTRAINT "fk_orgTaxRatesI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_snapshot" ADD CONSTRAINT "fk_orgTaxRatesSnapshot_byEmpId" FOREIGN KEY ("by_employee_id") REFERENCES "public"."org_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_snapshot" ADD CONSTRAINT "fk_orgTaxRatesSnapshot_rateId" FOREIGN KEY ("rate_id") REFERENCES "public"."org_tax_rates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_tax_category" ADD CONSTRAINT "fk_orgTaxRatesTaxCatg_rateId" FOREIGN KEY ("rate_id") REFERENCES "public"."org_tax_rates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_tax_rates_tax_category" ADD CONSTRAINT "fk_orgTaxRatesTaxCatg_catgId" FOREIGN KEY ("category_id") REFERENCES "public"."org_tax_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locale" ADD CONSTRAINT "fk_userLocale_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locale" ADD CONSTRAINT "fk_userLocale_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_profile" ADD CONSTRAINT "fk_userJobProfile_userProfileId" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_profile_metrics" ADD CONSTRAINT "fk_userJobProfileMetrics_userJobProfileId" FOREIGN KEY ("user_job_profile_id") REFERENCES "public"."user_job_profile"("user_profile_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_profile_skill" ADD CONSTRAINT "fk_userJobProfileSkill_userJobProfileId" FOREIGN KEY ("user_job_profile_id") REFERENCES "public"."user_job_profile"("user_profile_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_profile_skill" ADD CONSTRAINT "fk_userJobProfileSkill_skillId" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "fk_userProfile_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_contact_info" ADD CONSTRAINT "fk_userProfileContactInfo_userProfileId" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_contact_info" ADD CONSTRAINT "fk_userProfileContactInfo_contactInfoId" FOREIGN KEY ("contact_info_id") REFERENCES "public"."contact_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_i18n" ADD CONSTRAINT "fk_userProfileI18n_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_i18n" ADD CONSTRAINT "fk_userProfileI18n_localeKey" FOREIGN KEY ("locale_key") REFERENCES "public"."locale"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_i18n" ADD CONSTRAINT "fk_userProfileI18n_userProfileId" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_i18n" ADD CONSTRAINT "fk_userProfileI18n_seoMetaId" FOREIGN KEY ("seo_metadata_id") REFERENCES "public"."seo_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_org_membership" ADD CONSTRAINT "fk_userProfileOrgMembership_userProfileId" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile_org_membership" ADD CONSTRAINT "fk_userProfileOrgMembership_mbrId" FOREIGN KEY ("member_id") REFERENCES "public"."org_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_verification" ADD CONSTRAINT "fk_userEmailVerification_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_password_reset" ADD CONSTRAINT "fk_userPasswordReset_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "fk_userSession_userId" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ctry_isoCode" ON "country" USING btree ("iso_code");--> statement-breakpoint
CREATE INDEX "idx_ctry_isoCode3" ON "country" USING btree ("iso_code_3");--> statement-breakpoint
CREATE INDEX "idx_ctry_numericCode" ON "country" USING btree ("numeric_code");--> statement-breakpoint
CREATE INDEX "idx_ctry_name" ON "country" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ctry_nativeName" ON "country" USING btree ("native_name");--> statement-breakpoint
CREATE INDEX "idx_ctry_currencyCode" ON "country" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_ctry_defaultLocale" ON "country" USING btree ("default_locale");--> statement-breakpoint
CREATE INDEX "idx_ctry_flagEmoji" ON "country" USING btree ("flag_emoji");--> statement-breakpoint
CREATE INDEX "idx_ctry_phoneCode" ON "country" USING btree ("phone_code");--> statement-breakpoint
CREATE INDEX "idx_ctry_continent" ON "country" USING btree ("continent");--> statement-breakpoint
CREATE INDEX "idx_ctry_regn" ON "country" USING btree ("region");--> statement-breakpoint
CREATE INDEX "idx_ctry_subregion" ON "country" USING btree ("subregion");--> statement-breakpoint
CREATE INDEX "idx_ctry_capital" ON "country" USING btree ("capital");--> statement-breakpoint
CREATE INDEX "idx_ctry_languages" ON "country" USING btree ("languages");--> statement-breakpoint
CREATE INDEX "idx_ctry_timezones" ON "country" USING btree ("timezones");--> statement-breakpoint
CREATE INDEX "idx_ctry_isActive" ON "country" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ctry_vatRate" ON "country" USING btree ("vat_rate");--> statement-breakpoint
CREATE INDEX "idx_ctry_createdAt" ON "country" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ctry_lastUpdatedAt" ON "country" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_currency_code" ON "currency" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_currency_name" ON "currency" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_currency_symbol" ON "currency" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_currency_numericCode" ON "currency" USING btree ("numeric_code");--> statement-breakpoint
CREATE INDEX "idx_currency_minorUnit" ON "currency" USING btree ("minor_unit");--> statement-breakpoint
CREATE INDEX "idx_currency_isActive" ON "currency" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_currency_deletedAt" ON "currency" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_currency_createdAt" ON "currency" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_currency_lastUpdatedAt" ON "currency" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_baseCurrencyCode" ON "exchange_rate" USING btree ("base_currency_code");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_targetCurrencyCode" ON "exchange_rate" USING btree ("target_currency_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exchangeRate_baseCurrencyCode_14d9a480" ON "exchange_rate" USING btree ("base_currency_code","target_currency_code","valid_from","source");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_baseCurrencyCode_targetCurrencyCode" ON "exchange_rate" USING btree ("base_currency_code","target_currency_code");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_validFrom_validTo" ON "exchange_rate" USING btree ("valid_from","valid_to");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_validFrom_validTo_deletedAt" ON "exchange_rate" USING btree ("valid_from","valid_to","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_source" ON "exchange_rate" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_rateType" ON "exchange_rate" USING btree ("rate_type");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_createdAt" ON "exchange_rate" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_lastUpdatedAt" ON "exchange_rate" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_exchangeRate_deletedAt" ON "exchange_rate" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_locale_key" ON "locale" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_locale_name" ON "locale" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_locale_nativeName" ON "locale" USING btree ("native_name");--> statement-breakpoint
CREATE INDEX "idx_locale_languageCode" ON "locale" USING btree ("language_code");--> statement-breakpoint
CREATE INDEX "idx_locale_ctryCode" ON "locale" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "idx_locale_isActive" ON "locale" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_locale_isRtl" ON "locale" USING btree ("is_rtl");--> statement-breakpoint
CREATE INDEX "idx_locale_createdAt" ON "locale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_locale_lastUpdatedAt" ON "locale" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_locale_deletedAt" ON "locale" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_org_createdById" ON "org" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_org_slug" ON "org" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_org_name" ON "org" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_org_createdAt" ON "org" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_org_lastUpdatedAt" ON "org" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_org_deletedAt" ON "org" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_org_name" ON "org" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_org_slug" ON "org" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_orgCurrencySettings_orgId" ON "org_currency_settings" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgCurrencySettings_currencyCode" ON "org_currency_settings" USING btree ("currency_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgCurrencySettings_orgId_isDefault" ON "org_currency_settings" USING btree ("org_id","is_default") WHERE "org_currency_settings"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_seoMeta_orgId" ON "seo_metadata" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_seoMeta_status" ON "seo_metadata" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_seoMeta_title" ON "seo_metadata" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_seoMeta_createdAt" ON "seo_metadata" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMeta_lastUpdatedAt" ON "seo_metadata" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaAlternateUrl_seoMetaId" ON "seo_metadata_alternate_url" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seoMetaAlternateUrl_seoMetaId_localeKey" ON "seo_metadata_alternate_url" USING btree ("seo_metadata_id","locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seoMetaAlternateUrl_seoMetaId_hreflang" ON "seo_metadata_alternate_url" USING btree ("seo_metadata_id","hreflang");--> statement-breakpoint
CREATE INDEX "idx_seoMetaAlternateUrl_hreflang" ON "seo_metadata_alternate_url" USING btree ("hreflang");--> statement-breakpoint
CREATE INDEX "idx_seoMetaAlternateUrl_isDefault" ON "seo_metadata_alternate_url" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_seoMetaAlternateUrl_createdAt" ON "seo_metadata_alternate_url" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaAlternateUrl_lastUpdatedAt" ON "seo_metadata_alternate_url" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_seoMetaId" ON "seo_metadata_custom_meta" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seoMetaCustomMeta_seoMetaId_tagType_tagKey" ON "seo_metadata_custom_meta" USING btree ("seo_metadata_id","tag_type","tag_key");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_tagType" ON "seo_metadata_custom_meta" USING btree ("tag_type");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_catg" ON "seo_metadata_custom_meta" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_isActive" ON "seo_metadata_custom_meta" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_sortOrder" ON "seo_metadata_custom_meta" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_createdAt" ON "seo_metadata_custom_meta" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaCustomMeta_lastUpdatedAt" ON "seo_metadata_custom_meta" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaOpenGraph_seoMetaId" ON "seo_metadata_open_graph" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seoMetaOpenGraph_seoMetaId" ON "seo_metadata_open_graph" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_seoMetaOpenGraph_type" ON "seo_metadata_open_graph" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_seoMetaOpenGraph_createdAt" ON "seo_metadata_open_graph" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaOpenGraph_lastUpdatedAt" ON "seo_metadata_open_graph" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaStructuredData_seoMetaId" ON "seo_structured_data" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_seoMetaStructuredData_schemaType" ON "seo_structured_data" USING btree ("schema_type");--> statement-breakpoint
CREATE INDEX "idx_seoMetaStructuredData_createdAt" ON "seo_structured_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaStructuredData_lastUpdatedAt" ON "seo_structured_data" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaTwitterCard_seoMetaId" ON "seo_metadata_twitter_card" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seoMetaTwitterCard_seoMetaId" ON "seo_metadata_twitter_card" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_seoMetaTwitterCard_card" ON "seo_metadata_twitter_card" USING btree ("card");--> statement-breakpoint
CREATE INDEX "idx_seoMetaTwitterCard_createdAt" ON "seo_metadata_twitter_card" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_seoMetaTwitterCard_lastUpdatedAt" ON "seo_metadata_twitter_card" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgLocale_orgId" ON "org_locale" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgLocale_localeKey" ON "org_locale" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgLocale_orgId_localeKey" ON "org_locale" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgLocale_orgId_isDefault" ON "org_locale" USING btree ("org_id","is_default") WHERE "org_locale"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgLocale_isActive" ON "org_locale" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgLocale_createdAt" ON "org_locale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgLocale_lastUpdatedAt" ON "org_locale" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegn_orgId" ON "org_region" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgRegn_currencyCode" ON "org_region" USING btree ("currency_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgRegn_orgId_currencyCode" ON "org_region" USING btree ("org_id","currency_code") WHERE "org_region"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_orgRegn_createdAt" ON "org_region" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegn_lastUpdatedAt" ON "org_region" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegn_deletedAt" ON "org_region" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId" ON "org_region_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_localeKey" ON "org_region_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgRegnI18n_orgRegnId_isDefault" ON "org_region_i18n" USING btree ("org_region_id","is_default") WHERE "org_region_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId_localeKey" ON "org_region_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId_isDefault" ON "org_region_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId_createdAt" ON "org_region_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId_lastUpdatedAt" ON "org_region_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgId_deletedAt" ON "org_region_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_seoMetaId" ON "org_region_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_orgRegnId" ON "org_region_i18n" USING btree ("org_region_id");--> statement-breakpoint
CREATE INDEX "idx_orgRegnI18n_name" ON "org_region_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgEmp_orgId" ON "org_employee" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmp_mbrId" ON "org_employee" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmp_invitedById" ON "org_employee" USING btree ("invited_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgEmp_orgId_mbrId" ON "org_employee" USING btree ("org_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgEmp_orgId_userJobProfileId" ON "org_employee" USING btree ("org_id","user_job_profile_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_orgId" ON "org_employee_invitation" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_invitedBy" ON "org_employee_invitation" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_approvedBy" ON "org_employee_invitation" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_userJobProfileId" ON "org_employee_invitation" USING btree ("user_job_profile_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_orgId_email" ON "org_employee_invitation" USING btree ("org_id","email");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_orgId_status" ON "org_employee_invitation" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_orgId_userJobProfileId" ON "org_employee_invitation" USING btree ("org_id","user_job_profile_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpInvitation_orgId_expiresAt" ON "org_employee_invitation" USING btree ("org_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_orgId" ON "org_member" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_userProfileId" ON "org_member" USING btree ("user_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgMbr_userProfileId_orgId" ON "org_member" USING btree ("user_profile_id","org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_role" ON "org_member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_status" ON "org_member" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_createdAt" ON "org_member" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_lastActiveAt" ON "org_member" USING btree ("last_active_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_joinedAt" ON "org_member" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbr_deletedAt" ON "org_member" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgMbrInvitation_email_orgId" ON "org_member_invitation" USING btree ("email","org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId" ON "org_member_invitation" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_invitedByMbrId" ON "org_member_invitation" USING btree ("invited_by_member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_email" ON "org_member_invitation" USING btree ("org_id","email");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_status" ON "org_member_invitation" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_role" ON "org_member_invitation" USING btree ("org_id","role");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_type" ON "org_member_invitation" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_createdAt" ON "org_member_invitation" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_lastUpdatedAt" ON "org_member_invitation" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_expiresAt" ON "org_member_invitation" USING btree ("org_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_acceptedAt" ON "org_member_invitation" USING btree ("org_id","accepted_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrInvitation_orgId_declinedAt" ON "org_member_invitation" USING btree ("org_id","declined_at");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttribution_empId" ON "org_employee_attribution" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttribution_prodId" ON "org_employee_attribution" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgEmpAttribution_empId_prodId" ON "org_employee_attribution" USING btree ("employee_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttribution_compensationType" ON "org_employee_attribution" USING btree ("compensation_type");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttribution_revuSharePercentage" ON "org_employee_attribution" USING btree ("revenue_share_percentage");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttribution_sharePercentage" ON "org_employee_attribution" USING btree ("share_percentage");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_currencyCode" ON "org_employee_attribution_revenue" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_orderItemId" ON "org_employee_attribution_revenue" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_attributedEmpId" ON "org_employee_attribution_revenue" USING btree ("attributed_employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_recipientType" ON "org_employee_attribution_revenue" USING btree ("recipient_type");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_platformRecipient" ON "org_employee_attribution_revenue" USING btree ("platform_recipient");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_revuAmount" ON "org_employee_attribution_revenue" USING btree ("revenue_amount");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_revuShare" ON "org_employee_attribution_revenue" USING btree ("revenue_share");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_attributionBasis" ON "org_employee_attribution_revenue" USING btree ("attribution_basis");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_createdAt" ON "org_employee_attribution_revenue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgEmpAttributionRevu_lastUpdatedAt" ON "org_employee_attribution_revenue" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_account_orgId" ON "account" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_account_mbrId" ON "account" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_account_currencyCode" ON "account" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_account_name" ON "account" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_account_type" ON "account" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_account_createdAt" ON "account" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_account_lastUpdatedAt" ON "account" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_accountId" ON "account_balance_snapshot" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_snapshotDate" ON "account_balance_snapshot" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_createdAt" ON "account_balance_snapshot" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_lastUpdatedAt" ON "account_balance_snapshot" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_isSystem" ON "account_balance_snapshot" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "idx_accountBalanceSnapshot_isActive" ON "account_balance_snapshot" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_orgId" ON "account_transaction" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_createdByEmpId" ON "account_transaction" USING btree ("created_by_employee_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_currencyCode" ON "account_transaction" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_createdAt" ON "account_transaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_reference" ON "account_transaction" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_txnNumber" ON "account_transaction" USING btree ("transaction_number");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_txnDate" ON "account_transaction" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_accountTxn_totalAmount" ON "account_transaction" USING btree ("total_amount");--> statement-breakpoint
CREATE INDEX "idx_accountTxnContext_txnId" ON "account_transaction_context" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnContext_createdAt" ON "account_transaction_context" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_accountTxnEmpContext_empId" ON "account_transaction_employee_context" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnEmpContext_contextId" ON "account_transaction_employee_context" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnEmpContext_attributionPercentage" ON "account_transaction_employee_context" USING btree ("attribution_percentage");--> statement-breakpoint
CREATE INDEX "idx_accountTxnLine_accountId" ON "account_transaction_line" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnLine_txnId" ON "account_transaction_line" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnLine_normalBalance" ON "account_transaction_line" USING btree ("normal_balance");--> statement-breakpoint
CREATE INDEX "idx_accountTxnLine_amount" ON "account_transaction_line" USING btree ("amount");--> statement-breakpoint
CREATE INDEX "idx_accountTxnLine_currencyCode" ON "account_transaction_line" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_accountTxnMbrContext_mbrId" ON "account_transaction_member_context" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnMbrContext_contextId" ON "account_transaction_member_context" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnOrgContext_orgId" ON "account_transaction_org_context" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnOrgContext_contextId" ON "account_transaction_org_context" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnUserContext_orgId" ON "account_transaction_user_context" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnUserContext_userId" ON "account_transaction_user_context" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_accountTxnUserContext_contextId" ON "account_transaction_user_context" USING btree ("context_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contactInfo_entityType_entityId_isPrimary" ON "contact_info" USING btree ("entity_type","entity_id","is_primary") WHERE "contact_info"."is_primary" = TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contactInfo_entityType_entityId_email" ON "contact_info" USING btree ("entity_type","entity_id","email");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_entityType_entityId" ON "contact_info" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_email" ON "contact_info" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_contactType" ON "contact_info" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_createdAt" ON "contact_info" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_lastUpdatedAt" ON "contact_info" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_deletedAt" ON "contact_info" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_contactInfo_verifiedAt" ON "contact_info" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "idx_skill_appliedByOrgId" ON "skill" USING btree ("applied_by_org_id");--> statement-breakpoint
CREATE INDEX "idx_skill_createdByOrgId" ON "skill" USING btree ("created_by_org_id");--> statement-breakpoint
CREATE INDEX "idx_skill_parentSkillId" ON "skill" USING btree ("parent_skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_skill_createdByOrgId_slug" ON "skill" USING btree ("created_by_org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_skill_approvedAt" ON "skill" USING btree ("approved_at");--> statement-breakpoint
CREATE INDEX "idx_skill_createdAt" ON "skill" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_skill_lastUpdatedAt" ON "skill" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_localeKey" ON "skill_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_seoMetaId" ON "skill_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_skillId" ON "skill_i18n" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_skillI18n_skillId_localeKey" ON "skill_i18n" USING btree ("skill_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_name" ON "skill_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_createdAt" ON "skill_i18n" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_skillI18n_lastUpdatedAt" ON "skill_i18n" USING btree ("last_updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgBrand_orgId_slug" ON "org_brand" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_orgBrand_brandCatg" ON "org_brand" USING btree ("brand_category");--> statement-breakpoint
CREATE INDEX "idx_orgBrandMetrics_brandId" ON "org_brand_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_orgBrandMetrics_createdAt" ON "org_brand_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgBrandMetrics_lastUpdatedAt" ON "org_brand_metrics" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId" ON "org_brand_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_localeKey" ON "org_brand_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgBrandI18n_brandId_isDefault" ON "org_brand_i18n" USING btree ("brand_id","is_default") WHERE "org_brand_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId_localeKey" ON "org_brand_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId_isDefault" ON "org_brand_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId_createdAt" ON "org_brand_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId_lastUpdatedAt" ON "org_brand_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_orgId_deletedAt" ON "org_brand_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_seoMetaId" ON "org_brand_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_brandId" ON "org_brand_i18n" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_orgBrandI18n_name" ON "org_brand_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgFunnel_orgId" ON "org_funnel" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgFunnel_orgId_slug" ON "org_funnel" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_orgFunnel_createdAt" ON "org_funnel" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnel_lastUpdatedAt" ON "org_funnel" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnel_deletedAt" ON "org_funnel" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgFunnelDomain_funnelId_domain" ON "org_funnel_domain" USING btree ("funnel_id","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgFunnelDomain_domain" ON "org_funnel_domain" USING btree ("domain") WHERE "org_funnel_domain"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_funnelId" ON "org_funnel_domain" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_regnId" ON "org_funnel_domain" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_isCustomDomain" ON "org_funnel_domain" USING btree ("is_custom_domain");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_isSubdomain" ON "org_funnel_domain" USING btree ("is_subdomain");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_isCanonical" ON "org_funnel_domain" USING btree ("is_canonical");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_isManagedDns" ON "org_funnel_domain" USING btree ("is_managed_dns");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_sslEnabled" ON "org_funnel_domain" USING btree ("ssl_enabled");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_dnsVerified" ON "org_funnel_domain" USING btree ("dns_verified");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_isPreview" ON "org_funnel_domain" USING btree ("is_preview");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_hasCustom404" ON "org_funnel_domain" USING btree ("has_custom_404");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_createdAt" ON "org_funnel_domain" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_lastUpdatedAt" ON "org_funnel_domain" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_deletedAt" ON "org_funnel_domain" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelDomain_verificationToken" ON "org_funnel_domain" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId" ON "org_funnel_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_localeKey" ON "org_funnel_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgFunnelI18n_funnelId_isDefault" ON "org_funnel_i18n" USING btree ("funnel_id","is_default") WHERE "org_funnel_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId_localeKey" ON "org_funnel_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId_isDefault" ON "org_funnel_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId_createdAt" ON "org_funnel_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId_lastUpdatedAt" ON "org_funnel_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_orgId_deletedAt" ON "org_funnel_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_funnelId" ON "org_funnel_i18n" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_seoMetaId" ON "org_funnel_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelI18n_name" ON "org_funnel_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelRegn_funnelId" ON "org_funnel_region" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelRegn_regnId" ON "org_funnel_region" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_orgFunnelRegn_createdAt" ON "org_funnel_region" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgLesson_orgId" ON "org_lesson" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgLesson_orgId_type" ON "org_lesson" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "idx_orgLesson_orgId_createdAt" ON "org_lesson" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId" ON "org_lesson_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_localeKey" ON "org_lesson_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgLessonI18n_lessonId_isDefault" ON "org_lesson_i18n" USING btree ("lesson_id","is_default") WHERE "org_lesson_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId_localeKey" ON "org_lesson_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId_isDefault" ON "org_lesson_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId_createdAt" ON "org_lesson_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId_lastUpdatedAt" ON "org_lesson_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_orgId_deletedAt" ON "org_lesson_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_seoMetaId" ON "org_lesson_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_lessonId" ON "org_lesson_i18n" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_orgLessonI18n_title" ON "org_lesson_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgDept_orgId" ON "org_department" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgDept_parentId" ON "org_department" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgDept_orgId_slug" ON "org_department" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_orgDept_slug" ON "org_department" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_orgDept_createdAt" ON "org_department" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDept_lastUpdatedAt" ON "org_department" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgDept_deletedAt" ON "org_department" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_empId" ON "org_department_employees" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_deptId" ON "org_department_employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_status" ON "org_department_employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_joinedAt" ON "org_department_employees" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_createdAt" ON "org_department_employees" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptEmployees_lastUpdatedAt" ON "org_department_employees" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId" ON "org_department_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_localeKey" ON "org_department_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgDeptI18n_deptId_isDefault" ON "org_department_i18n" USING btree ("department_id","is_default") WHERE "org_department_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId_localeKey" ON "org_department_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId_isDefault" ON "org_department_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId_createdAt" ON "org_department_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId_lastUpdatedAt" ON "org_department_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_orgId_deletedAt" ON "org_department_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_deptId" ON "org_department_i18n" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptI18n_name" ON "org_department_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgDeptTm_deptId" ON "org_department_team" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptTm_tmId" ON "org_department_team" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_orgDeptTm_createdAt" ON "org_department_team" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTm_orgId" ON "org_team" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTm_createdById" ON "org_team" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgTm_slug_orgId" ON "org_team" USING btree ("slug","org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTm_createdAt" ON "org_team" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTm_lastUpdatedAt" ON "org_team" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgTm_slug" ON "org_team" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_empId" ON "org_team_employee" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_tmId" ON "org_team_employee" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_tmId_status" ON "org_team_employee" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_tmId_role" ON "org_team_employee" USING btree ("team_id","role");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_joinedAt" ON "org_team_employee" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_createdAt" ON "org_team_employee" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmEmp_lastUpdatedAt" ON "org_team_employee" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId" ON "org_team_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_localeKey" ON "org_team_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgTmI18n_tmId_isDefault" ON "org_team_i18n" USING btree ("team_id","is_default") WHERE "org_team_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId_localeKey" ON "org_team_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId_isDefault" ON "org_team_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId_createdAt" ON "org_team_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId_lastUpdatedAt" ON "org_team_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_orgId_deletedAt" ON "org_team_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_tmId" ON "org_team_i18n" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_orgTmI18n_tmId_name" ON "org_team_i18n" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_mbrId" ON "org_member_learning_profile" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_totalCoursesCompleted" ON "org_member_learning_profile" USING btree ("total_courses_completed");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_totalLearningInMinutes" ON "org_member_learning_profile" USING btree ("total_learning_in_minutes");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_totalCertificatesEarned" ON "org_member_learning_profile" USING btree ("total_certificates_earned");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_createdAt" ON "org_member_learning_profile" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrLearningProfile_lastUpdatedAt" ON "org_member_learning_profile" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_mbrId" ON "org_member_product_course_challenge_rating" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_courseId" ON "org_member_product_course_challenge_rating" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgMbrProdCourseChallengeRating_courseId_mbrId" ON "org_member_product_course_challenge_rating" USING btree ("course_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_levelRatingTotal" ON "org_member_product_course_challenge_rating" USING btree ("level_rating_total");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_levelRatingCount" ON "org_member_product_course_challenge_rating" USING btree ("level_rating_count");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_levelRatingAvg" ON "org_member_product_course_challenge_rating" USING btree ("level_rating_avg");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_b9fcceff" ON "org_member_product_course_challenge_rating" USING btree ("difficulty_rating_total");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_e4b97a10" ON "org_member_product_course_challenge_rating" USING btree ("difficulty_rating_count");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_difficultyRatingAvg" ON "org_member_product_course_challenge_rating" USING btree ("difficulty_rating_avg");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_createdAt" ON "org_member_product_course_challenge_rating" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseChallengeRating_lastUpdatedAt" ON "org_member_product_course_challenge_rating" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_mbrId" ON "org_member_product_course_enrollment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_courseId" ON "org_member_product_course_enrollment" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_status" ON "org_member_product_course_enrollment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_progressPercentage" ON "org_member_product_course_enrollment" USING btree ("progress_percentage");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_completedAt" ON "org_member_product_course_enrollment" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_enrolledAt" ON "org_member_product_course_enrollment" USING btree ("enrolled_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_lastAccessedAt" ON "org_member_product_course_enrollment" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_createdAt" ON "org_member_product_course_enrollment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdCourseEnrollment_lastUpdatedAt" ON "org_member_product_course_enrollment" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_prodId" ON "org_product_course" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_createdAt" ON "org_product_course" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_lastUpdatedAt" ON "org_product_course" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_level" ON "org_product_course" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_difficulty" ON "org_product_course" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_estimatedDurationInMinutes" ON "org_product_course" USING btree ("estimated_duration_in_minutes");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userLevelRatingTotal" ON "org_product_course" USING btree ("user_level_rating_total");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userLevelRatingCount" ON "org_product_course" USING btree ("user_level_rating_count");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userLevelRatingAvg" ON "org_product_course" USING btree ("user_level_rating_avg");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userDifficultyRatingTotal" ON "org_product_course" USING btree ("user_difficulty_rating_total");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userDifficultyRatingCount" ON "org_product_course" USING btree ("user_difficulty_rating_count");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourse_userDifficultyRatingAvg" ON "org_product_course" USING btree ("user_difficulty_rating_avg");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId" ON "org_product_course_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_localeKey" ON "org_product_course_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseI18n_courseId_isDefault" ON "org_product_course_i18n" USING btree ("course_id","is_default") WHERE "org_product_course_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId_localeKey" ON "org_product_course_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId_isDefault" ON "org_product_course_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId_createdAt" ON "org_product_course_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId_lastUpdatedAt" ON "org_product_course_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_orgId_deletedAt" ON "org_product_course_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseI18n_courseId" ON "org_product_course_i18n" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_courseId" ON "org_product_course_module" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModule_courseId_sortOrder" ON "org_product_course_module" USING btree ("course_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_sortOrder" ON "org_product_course_module" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_requiredAccessTier" ON "org_product_course_module" USING btree ("required_access_tier");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_isRequired" ON "org_product_course_module" USING btree ("is_required");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_estimatedDurationInMinutes" ON "org_product_course_module" USING btree ("estimated_duration_in_minutes");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_createdAt" ON "org_product_course_module" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModule_lastUpdatedAt" ON "org_product_course_module" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId" ON "org_product_course_module_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_localeKey" ON "org_product_course_module_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleI18n_moduleId_isDefault" ON "org_product_course_module_i18n" USING btree ("moduleId","is_default") WHERE "org_product_course_module_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId_localeKey" ON "org_product_course_module_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId_isDefault" ON "org_product_course_module_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId_createdAt" ON "org_product_course_module_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId_lastUpdatedAt" ON "org_product_course_module_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_orgId_deletedAt" ON "org_product_course_module_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_seoMetaId" ON "org_product_course_module_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_moduleId" ON "org_product_course_module_i18n" USING btree ("moduleId");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleI18n_title" ON "org_product_course_module_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_moduleId" ON "org_product_course_module_section" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleSection_moduleId_sortOrder" ON "org_product_course_module_section" USING btree ("module_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_sortOrder" ON "org_product_course_module_section" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_requiredAccessTier" ON "org_product_course_module_section" USING btree ("required_access_tier");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_isRequired" ON "org_product_course_module_section" USING btree ("is_required");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_82550254" ON "org_product_course_module_section" USING btree ("estimated_duration_in_minutes");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_createdAt" ON "org_product_course_module_section" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSection_lastUpdatedAt" ON "org_product_course_module_section" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId" ON "org_product_course_module_section_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_localeKey" ON "org_product_course_module_section_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleSectionI18n_sectionId_isDefault" ON "org_product_course_module_section_i18n" USING btree ("section_id","is_default") WHERE "org_product_course_module_section_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId_localeKey" ON "org_product_course_module_section_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId_isDefault" ON "org_product_course_module_section_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId_createdAt" ON "org_product_course_module_section_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId_lastUpdatedAt" ON "org_product_course_module_section_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_orgId_deletedAt" ON "org_product_course_module_section_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_seoMetaId" ON "org_product_course_module_section_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionI18n_sectionId" ON "org_product_course_module_section_i18n" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_sectionId" ON "org_product_course_module_section_lesson" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_lessonId" ON "org_product_course_module_section_lesson" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleSectionLesson_sectionId_lessonId" ON "org_product_course_module_section_lesson" USING btree ("section_id","lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleSectionLesson_sectionId_sortOrder" ON "org_product_course_module_section_lesson" USING btree ("section_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_sortOrder" ON "org_product_course_module_section_lesson" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_requiredAccessTier" ON "org_product_course_module_section_lesson" USING btree ("required_access_tier");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_createdAt" ON "org_product_course_module_section_lesson" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLesson_lastUpdatedAt" ON "org_product_course_module_section_lesson" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_localeKey" ON "org_product_course_module_section_lesson_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseModuleSectionLessonI18n_87ae2804" ON "org_product_course_module_section_lesson_i18n" USING btree ("lesson_id","is_default") WHERE "org_product_course_module_section_lesson_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId_b2a39a54" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId_ae916fda" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId_4cbc0e54" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId_ce2a31a6" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_orgId_1b1b8fa8" ON "org_product_course_module_section_lesson_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_seoMetaId" ON "org_product_course_module_section_lesson_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_lessonId" ON "org_product_course_module_section_lesson_i18n" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseModuleSectionLessonI18n_title" ON "org_product_course_module_section_lesson_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_courseId" ON "org_product_course_skill" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_skillId" ON "org_product_course_skill" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCourseSkill_courseId_skillId" ON "org_product_course_skill" USING btree ("course_id","skill_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_weight" ON "org_product_course_skill" USING btree ("weight");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_createdAt" ON "org_product_course_skill" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_lastUpdatedAt" ON "org_product_course_skill" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdCourseSkill_deletedAt" ON "org_product_course_skill" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdColl_orgId" ON "org_product_collection" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdColl_slug_orgId" ON "org_product_collection" USING btree ("slug","org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdColl_title" ON "org_product_collection" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgProdColl_createdAt" ON "org_product_collection" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdColl_lastUpdatedAt" ON "org_product_collection" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdColl_deletedAt" ON "org_product_collection" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdCollProd_prodId_collId" ON "org_product_collection_product" USING btree ("product_id","collection_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdCollProd_createdAt" ON "org_product_collection_product" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_orgId" ON "org_coupon" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_discountId" ON "org_coupon" USING btree ("discount_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgCoupon_orgId_code" ON "org_coupon" USING btree ("org_id","code");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_isActive" ON "org_coupon" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_startsAt_endsAt" ON "org_coupon" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_createdAt" ON "org_coupon" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_lastUpdatedAt" ON "org_coupon" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgCoupon_deletedAt" ON "org_coupon" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId" ON "org_coupon_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_localeKey" ON "org_coupon_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgCouponI18n_couponId_isDefault" ON "org_coupon_i18n" USING btree ("coupon_id","is_default") WHERE "org_coupon_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId_localeKey" ON "org_coupon_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId_isDefault" ON "org_coupon_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId_createdAt" ON "org_coupon_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId_lastUpdatedAt" ON "org_coupon_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_orgId_deletedAt" ON "org_coupon_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_couponId" ON "org_coupon_i18n" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_orgCouponI18n_title" ON "org_coupon_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId" ON "org_discount" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_currencyCode" ON "org_discount" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId_type" ON "org_discount" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId_isActive" ON "org_discount" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId_appliesTo" ON "org_discount" USING btree ("org_id","applies_to");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId_startsAt_endsAt" ON "org_discount" USING btree ("org_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscount_orgId_currencyCode" ON "org_discount" USING btree ("org_id","currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId" ON "org_discount_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_localeKey" ON "org_discount_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgDiscountI18n_discountId_isDefault" ON "org_discount_i18n" USING btree ("discount_id","is_default") WHERE "org_discount_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId_localeKey" ON "org_discount_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId_isDefault" ON "org_discount_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId_createdAt" ON "org_discount_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId_lastUpdatedAt" ON "org_discount_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_orgId_deletedAt" ON "org_discount_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_discountId" ON "org_discount_i18n" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountI18n_title" ON "org_discount_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProd_discountId" ON "org_discount_product" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProd_prodId" ON "org_discount_product" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProd_createdAt" ON "org_discount_product" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdColl_discountId" ON "org_discount_product_collection" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdColl_collId" ON "org_discount_product_collection" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdColl_createdAt" ON "org_discount_product_collection" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdVar_discountId" ON "org_discount_product_variant" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdVar_varId" ON "org_discount_product_variant" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_orgDiscountProdVar_createdAt" ON "org_discount_product_variant" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_orgId" ON "org_gift_card" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_currencyCode" ON "org_gift_card" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_issuedByEmpId" ON "org_gift_card" USING btree ("issued_by_employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_issuedToMbrId" ON "org_gift_card" USING btree ("issued_to_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgGiftCard_orgId_code" ON "org_gift_card" USING btree ("org_id","code");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_issuedToEmail" ON "org_gift_card" USING btree ("issued_to_email");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_isActive" ON "org_gift_card" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_expiresAt" ON "org_gift_card" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_balance" ON "org_gift_card" USING btree ("balance");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_issuedAt" ON "org_gift_card" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_createdAt" ON "org_gift_card" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_lastUpdatedAt" ON "org_gift_card" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCard_deletedAt" ON "org_gift_card" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId" ON "org_gift_card_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_localeKey" ON "org_gift_card_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgGiftCardI18n_giftCardId_isDefault" ON "org_gift_card_i18n" USING btree ("gift_card_id","is_default") WHERE "org_gift_card_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId_localeKey" ON "org_gift_card_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId_isDefault" ON "org_gift_card_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId_createdAt" ON "org_gift_card_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId_lastUpdatedAt" ON "org_gift_card_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_orgId_deletedAt" ON "org_gift_card_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_giftCardId" ON "org_gift_card_i18n" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "idx_orgGiftCardI18n_title" ON "org_gift_card_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_mbrId" ON "org_member_gift_card_usage" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_giftCardId" ON "org_member_gift_card_usage" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_orderId" ON "org_member_gift_card_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_usedAt" ON "org_member_gift_card_usage" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_createdAt" ON "org_member_gift_card_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_lastUpdatedAt" ON "org_member_gift_card_usage" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrGiftCardUsage_mbrId_giftCardId" ON "org_member_gift_card_usage" USING btree ("member_id","gift_card_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_mbrId" ON "org_member_discount_usage" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_discountId" ON "org_member_discount_usage" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_orderId" ON "org_member_discount_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_mbrId_discountId" ON "org_member_discount_usage" USING btree ("member_id","discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_usedAt" ON "org_member_discount_usage" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_createdAt" ON "org_member_discount_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrDiscountUsage_lastUpdatedAt" ON "org_member_discount_usage" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_orgId" ON "org_promotion" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgPromotion_orgId_slug" ON "org_promotion" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_isActive" ON "org_promotion" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_startsAt_endsAt" ON "org_promotion" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_createdAt" ON "org_promotion" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_lastUpdatedAt" ON "org_promotion" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_deletedAt" ON "org_promotion" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotion_isActive_startsAt_endsAt" ON "org_promotion" USING btree ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionDiscount_promotionId" ON "org_promotion_discount" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionDiscount_discountId" ON "org_promotion_discount" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionDiscount_createdAt" ON "org_promotion_discount" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId" ON "org_promotion_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_localeKey" ON "org_promotion_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgPromotionI18n_promotionId_isDefault" ON "org_promotion_i18n" USING btree ("promotion_id","is_default") WHERE "org_promotion_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId_localeKey" ON "org_promotion_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId_isDefault" ON "org_promotion_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId_createdAt" ON "org_promotion_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId_lastUpdatedAt" ON "org_promotion_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_orgId_deletedAt" ON "org_promotion_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_promotionId" ON "org_promotion_i18n" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "idx_orgPromotionI18n_title" ON "org_promotion_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId" ON "org_member_order" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_mbrId" ON "org_member_order" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgMbrOrder_orgId_displayId" ON "org_member_order" USING btree ("org_id","display_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_status" ON "org_member_order" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_mbrId_status" ON "org_member_order" USING btree ("member_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_totalAmount" ON "org_member_order" USING btree ("org_id","total_amount");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_currencyCode" ON "org_member_order" USING btree ("org_id","currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_orderedAt" ON "org_member_order" USING btree ("org_id","ordered_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_paidAt" ON "org_member_order" USING btree ("org_id","paid_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_fulfilledAt" ON "org_member_order" USING btree ("org_id","fulfilled_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_externalPaymId" ON "org_member_order" USING btree ("org_id","external_payment_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_paymMethod" ON "org_member_order" USING btree ("org_id","payment_method");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_createdAt" ON "org_member_order" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_lastUpdatedAt" ON "org_member_order" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrder_orgId_deletedAt" ON "org_member_order" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_orderId" ON "org_member_order_discount" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_discountId" ON "org_member_order_discount" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_couponId" ON "org_member_order_discount" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_giftCardId" ON "org_member_order_discount" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_discountAmount" ON "org_member_order_discount" USING btree ("discount_amount");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_discountType" ON "org_member_order_discount" USING btree ("discount_type");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderDiscount_createdAt" ON "org_member_order_discount" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_orderId" ON "org_member_order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_prodId" ON "org_member_order_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_varId" ON "org_member_order_item" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_paymPlanId" ON "org_member_order_item" USING btree ("payment_plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_prodId_varId" ON "org_member_order_item" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_selectedAccessTier" ON "org_member_order_item" USING btree ("selected_access_tier");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_unitPrice" ON "org_member_order_item" USING btree ("unit_price");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_quantity" ON "org_member_order_item" USING btree ("quantity");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_subtotal" ON "org_member_order_item" USING btree ("subtotal");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_totalPrice" ON "org_member_order_item" USING btree ("total_price");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderItem_createdAt" ON "org_member_order_item" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_orderId" ON "org_member_order_payment" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgMbrOrderPaym_orderId_gatewayTxnId" ON "org_member_order_payment" USING btree ("order_id","gateway_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_status" ON "org_member_order_payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_paymGateway" ON "org_member_order_payment" USING btree ("payment_gateway");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_paymMethod" ON "org_member_order_payment" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_authorizedAt" ON "org_member_order_payment" USING btree ("authorized_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_capturedAt" ON "org_member_order_payment" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_settledAt" ON "org_member_order_payment" USING btree ("settled_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_disputedAt" ON "org_member_order_payment" USING btree ("disputed_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_createdAt" ON "org_member_order_payment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderPaym_lastUpdatedAt" ON "org_member_order_payment" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_orderId" ON "org_member_order_tax_calculation" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_taxRateSnapshotId" ON "org_member_order_tax_calculation" USING btree ("tax_rate_snapshot_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_taxableAmount" ON "org_member_order_tax_calculation" USING btree ("taxable_amount");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_calculatedTaxAmount" ON "org_member_order_tax_calculation" USING btree ("calculated_tax_amount");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_calculationMethod" ON "org_member_order_tax_calculation" USING btree ("calculation_method");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_appliedRate" ON "org_member_order_tax_calculation" USING btree ("applied_rate");--> statement-breakpoint
CREATE INDEX "idx_orgMbrOrderTaxCalculation_createdAt" ON "org_member_order_tax_calculation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_orgId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_userId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_mbrId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_planId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_status" ON "org_member_product_variant_payment_plan_subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_accessExpiresAt" ON "org_member_product_variant_payment_plan_subscription" USING btree ("access_expires_at");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_externalSubId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("external_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_externalCustId" ON "org_member_product_variant_payment_plan_subscription" USING btree ("external_customer_id");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_currencyCode" ON "org_member_product_variant_payment_plan_subscription" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgMbrProdVarPaymPlanSub_price_currencyCode" ON "org_member_product_variant_payment_plan_subscription" USING btree ("price","currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_orgId" ON "org_product_variant_payment_plan" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_varId" ON "org_product_variant_payment_plan" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVarPaymPlan_varId_slug" ON "org_product_variant_payment_plan" USING btree ("variant_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVarPaymPlan_varId_isDefault" ON "org_product_variant_payment_plan" USING btree ("variant_id","is_default") WHERE "org_product_variant_payment_plan"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_type" ON "org_product_variant_payment_plan" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_isActive" ON "org_product_variant_payment_plan" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_isFeatured" ON "org_product_variant_payment_plan" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_validFrom_validTo" ON "org_product_variant_payment_plan" USING btree ("valid_from","valid_to");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_isTransferable" ON "org_product_variant_payment_plan" USING btree ("is_transferable");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_allowGifting" ON "org_product_variant_payment_plan" USING btree ("allow_gifting");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_accessTier" ON "org_product_variant_payment_plan" USING btree ("access_tier");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_sortOrder" ON "org_product_variant_payment_plan" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_deletedAt" ON "org_product_variant_payment_plan" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_completedAt" ON "org_product_variant_payment_plan" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlan_lastUpdatedAt" ON "org_product_variant_payment_plan" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_localeKey" ON "org_product_variant_payment_plan_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVarPaymPlanI18n_planId_isDefault" ON "org_product_variant_payment_plan_i18n" USING btree ("plan_id","is_default") WHERE "org_product_variant_payment_plan_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId_localeKey" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId_isDefault" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId_createdAt" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId_lastUpdatedAt" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_orgId_deletedAt" ON "org_product_variant_payment_plan_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_seoMetaId" ON "org_product_variant_payment_plan_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_planId" ON "org_product_variant_payment_plan_i18n" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanI18n_title" ON "org_product_variant_payment_plan_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanOneTimeType_currencyCode" ON "org_product_variant_payment_plan_one_time_type" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanOneTimeType_planId" ON "org_product_variant_payment_plan_one_time_type" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanOneTimeType_maxPurchasesPerUser" ON "org_product_variant_payment_plan_one_time_type" USING btree ("max_purchases_per_user");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanOneTimeType_completedAt" ON "org_product_variant_payment_plan_one_time_type" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanOneTimeType_lastUpdatedAt" ON "org_product_variant_payment_plan_one_time_type" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_currencyCode" ON "org_product_variant_payment_plan_subscription_type" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_planId" ON "org_product_variant_payment_plan_subscription_type" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_billingInterval" ON "org_product_variant_payment_plan_subscription_type" USING btree ("billing_interval");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_d85d83d7" ON "org_product_variant_payment_plan_subscription_type" USING btree ("custom_billing_interval_count");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_customBillingIntervalUnit" ON "org_product_variant_payment_plan_subscription_type" USING btree ("custom_billing_interval_unit");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_trialPeriodDays" ON "org_product_variant_payment_plan_subscription_type" USING btree ("trial_period_days");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_price" ON "org_product_variant_payment_plan_subscription_type" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_completedAt" ON "org_product_variant_payment_plan_subscription_type" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubType_lastUpdatedAt" ON "org_product_variant_payment_plan_subscription_type" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_localeKey" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVarPaymPlanSubTypeI18n_planId_isDefault" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("plan_id","is_default") WHERE "org_product_variant_payment_plan_subscription_type_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId_localeKey" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId_isDefault" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId_createdAt" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId_lastUpdatedAt" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_orgId_deletedAt" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarPaymPlanSubTypeI18n_planId" ON "org_product_variant_payment_plan_subscription_type_i18n" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_orgProd_orgId" ON "org_product" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProd_orgId_slug" ON "org_product" USING btree ("org_id","slug");--> statement-breakpoint
CREATE INDEX "idx_orgProd_orgId_status" ON "org_product" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgProd_orgId_type" ON "org_product" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "idx_orgProd_status" ON "org_product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orgProd_type" ON "org_product" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_orgProd_createdAt" ON "org_product" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProd_lastUpdatedAt" ON "org_product" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProd_deletedAt" ON "org_product" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_submittedByEmpId" ON "org_product_approval" USING btree ("submitted_by_employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_prodId" ON "org_product_approval" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_prodId_status" ON "org_product_approval" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_submittedByEmpId_status" ON "org_product_approval" USING btree ("submitted_by_employee_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_reviewedByEmpId_status" ON "org_product_approval" USING btree ("reviewed_by_employee_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_reviewedAt" ON "org_product_approval" USING btree ("reviewed_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_createdAt" ON "org_product_approval" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdApproval_lastUpdatedAt" ON "org_product_approval" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdBrandAttribution_brandId" ON "org_product_brand_attribution" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdBrandAttribution_prodId" ON "org_product_brand_attribution" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdBrandAttribution_createdAt" ON "org_product_brand_attribution" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId" ON "org_product_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_localeKey" ON "org_product_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdI18n_prodId_isDefault" ON "org_product_i18n" USING btree ("product_id","is_default") WHERE "org_product_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId_localeKey" ON "org_product_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId_isDefault" ON "org_product_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId_createdAt" ON "org_product_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId_lastUpdatedAt" ON "org_product_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_orgId_deletedAt" ON "org_product_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_seoMetaId" ON "org_product_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_prodId" ON "org_product_i18n" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdI18n_title" ON "org_product_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_lastAllocationByEmpId" ON "org_product_revenue_pool" USING btree ("last_allocation_by_employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_prodId" ON "org_product_revenue_pool" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_totalAllocatedPercentage" ON "org_product_revenue_pool" USING btree ("total_allocated_percentage");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_remainingPercentage" ON "org_product_revenue_pool" USING btree ("remaining_percentage");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_lastAllocationAt" ON "org_product_revenue_pool" USING btree ("last_allocation_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_createdAt" ON "org_product_revenue_pool" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdRevuPool_lastUpdatedAt" ON "org_product_revenue_pool" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_prodId" ON "org_product_variant" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_taxCatgId" ON "org_product_variant" USING btree ("tax_category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVar_prodId_slug" ON "org_product_variant" USING btree ("product_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVar_prodId_isDefault" ON "org_product_variant" USING btree ("product_id","is_default") WHERE "org_product_variant"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_prodId_isActive" ON "org_product_variant" USING btree ("product_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_prodId_type" ON "org_product_variant" USING btree ("product_id","type");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_isActive" ON "org_product_variant" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_type" ON "org_product_variant" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_isDefault" ON "org_product_variant" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_isFeatured" ON "org_product_variant" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_sortOrder" ON "org_product_variant" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_startsAt" ON "org_product_variant" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_endsAt" ON "org_product_variant" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_createdAt" ON "org_product_variant" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_lastUpdatedAt" ON "org_product_variant" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVar_deletedAt" ON "org_product_variant" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId" ON "org_product_variant_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_localeKey" ON "org_product_variant_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgProdVarI18n_varId_isDefault" ON "org_product_variant_i18n" USING btree ("variant_id","is_default") WHERE "org_product_variant_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId_localeKey" ON "org_product_variant_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId_isDefault" ON "org_product_variant_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId_createdAt" ON "org_product_variant_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId_lastUpdatedAt" ON "org_product_variant_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_orgId_deletedAt" ON "org_product_variant_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_seoMetaId" ON "org_product_variant_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_varId" ON "org_product_variant_i18n" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_orgProdVarI18n_title" ON "org_product_variant_i18n" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatg_code" ON "org_tax_category" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId" ON "org_tax_category_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_localeKey" ON "org_tax_category_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgTaxCatgI18n_catgId_isDefault" ON "org_tax_category_i18n" USING btree ("category_id","is_default") WHERE "org_tax_category_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId_localeKey" ON "org_tax_category_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId_isDefault" ON "org_tax_category_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId_createdAt" ON "org_tax_category_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId_lastUpdatedAt" ON "org_tax_category_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_orgId_deletedAt" ON "org_tax_category_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_catgId" ON "org_tax_category_i18n" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_seoMetaId" ON "org_tax_category_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxCatgI18n_name" ON "org_tax_category_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRates_orgId" ON "org_tax_rates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRates_currencyCode" ON "org_tax_rates" USING btree ("currency_code");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRates_regnId" ON "org_tax_rates" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRates_code" ON "org_tax_rates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRates_type" ON "org_tax_rates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId" ON "org_tax_rates_i18n" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_localeKey" ON "org_tax_rates_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgTaxRatesI18n_rateId_isDefault" ON "org_tax_rates_i18n" USING btree ("rate_id","is_default") WHERE "org_tax_rates_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId_localeKey" ON "org_tax_rates_i18n" USING btree ("org_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId_isDefault" ON "org_tax_rates_i18n" USING btree ("org_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId_createdAt" ON "org_tax_rates_i18n" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId_lastUpdatedAt" ON "org_tax_rates_i18n" USING btree ("org_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_orgId_deletedAt" ON "org_tax_rates_i18n" USING btree ("org_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_rateId" ON "org_tax_rates_i18n" USING btree ("rate_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_seoMetaId" ON "org_tax_rates_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesI18n_name" ON "org_tax_rates_i18n" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesSnapshot_byEmpId" ON "org_tax_rates_snapshot" USING btree ("by_employee_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesSnapshot_rateId" ON "org_tax_rates_snapshot" USING btree ("rate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orgTaxRatesSnapshot_rateId_b165a3f5" ON "org_tax_rates_snapshot" USING btree ("rate_id","system_changes_version","modification_version");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesSnapshot_createdAt" ON "org_tax_rates_snapshot" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesTaxCatg_rateId" ON "org_tax_rates_tax_category" USING btree ("rate_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesTaxCatg_catgId" ON "org_tax_rates_tax_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_orgTaxRatesTaxCatg_createdAt" ON "org_tax_rates_tax_category" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userLocale_userId" ON "user_locale" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_userLocale_localeKey" ON "user_locale" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userLocale_userId_localeKey" ON "user_locale" USING btree ("user_id","locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userLocale_userId_isDefault" ON "user_locale" USING btree ("user_id","is_default") WHERE "user_locale"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_userLocale_isActive" ON "user_locale" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_userLocale_createdAt" ON "user_locale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userLocale_lastUpdatedAt" ON "user_locale" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userLocale_isDefault" ON "user_locale" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_userProfileId" ON "user_job_profile" USING btree ("user_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userJobProfile_slug" ON "user_job_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_slug" ON "user_job_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_displayName" ON "user_job_profile" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_headline" ON "user_job_profile" USING btree ("headline");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_createdAt" ON "user_job_profile" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_lastUpdatedAt" ON "user_job_profile" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_verifiedAt" ON "user_job_profile" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfile_deletedAt" ON "user_job_profile" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_userJobProfileId" ON "user_job_profile_metrics" USING btree ("user_job_profile_id");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_createdAt" ON "user_job_profile_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_lastUpdatedAt" ON "user_job_profile_metrics" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_total" ON "user_job_profile_metrics" USING btree ("total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_ratingTotal" ON "user_job_profile_metrics" USING btree ("rating_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_ratingCount" ON "user_job_profile_metrics" USING btree ("rating_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_ratingAvg" ON "user_job_profile_metrics" USING btree ("rating_avg");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_reviewsCount" ON "user_job_profile_metrics" USING btree ("reviews_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_revuGeneratedTotal" ON "user_job_profile_metrics" USING btree ("revenue_generated_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_payoutsTotal" ON "user_job_profile_metrics" USING btree ("payouts_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_studentsCount" ON "user_job_profile_metrics" USING btree ("students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_completedByStudentsCount" ON "user_job_profile_metrics" USING btree ("completed_by_students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_inProgressByStudentsCount" ON "user_job_profile_metrics" USING btree ("in_progress_by_students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesTotal" ON "user_job_profile_metrics" USING btree ("courses_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesRatingTotal" ON "user_job_profile_metrics" USING btree ("courses_rating_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesRatingCount" ON "user_job_profile_metrics" USING btree ("courses_rating_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesRatingAvg" ON "user_job_profile_metrics" USING btree ("courses_rating_avg");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesReviewsCount" ON "user_job_profile_metrics" USING btree ("courses_reviews_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesRevuGeneratedTotal" ON "user_job_profile_metrics" USING btree ("courses_revenue_generated_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesPayoutsTotal" ON "user_job_profile_metrics" USING btree ("courses_payouts_total");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_coursesStudentsCount" ON "user_job_profile_metrics" USING btree ("courses_students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_4f27960c" ON "user_job_profile_metrics" USING btree ("courses_completed_by_students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileMetrics_57fc9a8b" ON "user_job_profile_metrics" USING btree ("courses_in_progress_by_students_count");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileSkill_userJobProfileId" ON "user_job_profile_skill" USING btree ("user_job_profile_id");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileSkill_skillId" ON "user_job_profile_skill" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_userJobProfileSkill_createdAt" ON "user_job_profile_skill" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userProfile_userId" ON "user_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userProfile_userId_type" ON "user_profile" USING btree ("user_id","type") WHERE "user_profile"."type" = 'main';--> statement-breakpoint
CREATE INDEX "idx_userProfile_createdAt" ON "user_profile" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userProfile_lastUpdatedAt" ON "user_profile" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userProfile_slug" ON "user_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_userProfile_displayName" ON "user_profile" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_userProfile_isActive" ON "user_profile" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_userProfile_type" ON "user_profile" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_userProfileId" ON "user_profile_contact_info" USING btree ("user_profile_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_contactInfoId" ON "user_profile_contact_info" USING btree ("contact_info_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userProfileContactInfo_userProfileId_isDefault" ON "user_profile_contact_info" USING btree ("user_profile_id","is_default") WHERE "user_profile_contact_info"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_isDefault" ON "user_profile_contact_info" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_createdAt" ON "user_profile_contact_info" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_lastUpdatedAt" ON "user_profile_contact_info" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileContactInfo_deletedAt" ON "user_profile_contact_info" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId" ON "user_profile_i18n" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_localeKey" ON "user_profile_i18n" USING btree ("locale_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userProfileI18n_userProfileId_isDefault" ON "user_profile_i18n" USING btree ("user_profile_id","is_default") WHERE "user_profile_i18n"."is_default" = TRUE;--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId_localeKey" ON "user_profile_i18n" USING btree ("user_id","locale_key");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId_isDefault" ON "user_profile_i18n" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId_createdAt" ON "user_profile_i18n" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId_lastUpdatedAt" ON "user_profile_i18n" USING btree ("user_id","last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userId_deletedAt" ON "user_profile_i18n" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_userProfileId" ON "user_profile_i18n" USING btree ("user_profile_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileI18n_seoMetaId" ON "user_profile_i18n" USING btree ("seo_metadata_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_userProfileId" ON "user_profile_org_membership" USING btree ("user_profile_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_mbrId" ON "user_profile_org_membership" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userProfileOrgMembership_userProfileId_mbrId" ON "user_profile_org_membership" USING btree ("user_profile_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_joinedAt" ON "user_profile_org_membership" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_approvedAt" ON "user_profile_org_membership" USING btree ("approved_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_startedAt" ON "user_profile_org_membership" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_endedAt" ON "user_profile_org_membership" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_affiliationType" ON "user_profile_org_membership" USING btree ("affiliation_type");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_connectionMethod" ON "user_profile_org_membership" USING btree ("connection_method");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_createdAt" ON "user_profile_org_membership" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userProfileOrgMembership_lastUpdatedAt" ON "user_profile_org_membership" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_user_createdAt" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_lastUpdatedAt" ON "user" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_user_lastLoginAt" ON "user" USING btree ("last_login_at");--> statement-breakpoint
CREATE INDEX "idx_user_displayName" ON "user" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_name" ON "user" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_userEmailVerification_userId" ON "user_email_verification" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userEmailVerification_code" ON "user_email_verification" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_userEmailVerification_createdAt" ON "user_email_verification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userEmailVerification_expiresAt" ON "user_email_verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_userEmailVerification_email" ON "user_email_verification" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_userId" ON "user_password_reset" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_userPasswordReset_code" ON "user_password_reset" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_createdAt" ON "user_password_reset" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_expiresAt" ON "user_password_reset" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_email" ON "user_password_reset" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_emailVerifiedAt" ON "user_password_reset" USING btree ("email_verified_at");--> statement-breakpoint
CREATE INDEX "idx_userPasswordReset_twoFactorVerifiedAt" ON "user_password_reset" USING btree ("two_factor_verified_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_userId" ON "user_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_userSession_createdAt" ON "user_session" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_lastUpdatedAt" ON "user_session" USING btree ("last_updated_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_expiresAt" ON "user_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_authStrategy" ON "user_session" USING btree ("auth_strategy");--> statement-breakpoint
CREATE INDEX "idx_userSession_revokedAt" ON "user_session" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_lastUsedAt" ON "user_session" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_lastVerifiedAt" ON "user_session" USING btree ("last_verified_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_lastExtendedAt" ON "user_session" USING btree ("last_extended_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_userId_expiresAt" ON "user_session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_expiresAt_createdAt" ON "user_session" USING btree ("expires_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_userSession_expiresAt_revokedAt" ON "user_session" USING btree ("expires_at","revoked_at");