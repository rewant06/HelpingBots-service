--
-- PostgreSQL database dump
--

\restrict jax61fdJkavI8umhppHaUergaYcBIfTUewAw8O1Nehp1uEtq8MnSt8FFUDfqV1i

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: iam; Type: SCHEMA; Schema: -; Owner: user
--

CREATE SCHEMA iam;


ALTER SCHEMA iam OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: iam; Owner: user
--

CREATE TABLE iam._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE iam._prisma_migrations OWNER TO "user";

--
-- Name: AnonymousProfile; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."AnonymousProfile" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "shadowUserId" text NOT NULL,
    pseudonym text NOT NULL,
    "avatarUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AnonymousProfile" OWNER TO "user";

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    content text NOT NULL,
    "tenantId" text NOT NULL,
    "shadowUserId" text NOT NULL,
    "authorDisplayName" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Comment" OWNER TO "user";

--
-- Name: PollOption; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."PollOption" (
    id text NOT NULL,
    text text NOT NULL,
    "voteCount" integer DEFAULT 0 NOT NULL,
    "postId" text NOT NULL
);


ALTER TABLE public."PollOption" OWNER TO "user";

--
-- Name: PollVote; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."PollVote" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "shadowUserId" text NOT NULL,
    "pollOptionId" text NOT NULL
);


ALTER TABLE public."PollVote" OWNER TO "user";

--
-- Name: Post; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "isGlobal" boolean DEFAULT false NOT NULL,
    "tenantId" text NOT NULL,
    "shadowUserId" text NOT NULL,
    title text,
    content text NOT NULL,
    "isEdited" boolean DEFAULT false NOT NULL,
    "isAnonymous" boolean DEFAULT true NOT NULL,
    "authorDisplayName" text,
    "spaceId" text,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "reactionCount" integer DEFAULT 0 NOT NULL,
    "commentCount" integer DEFAULT 0 NOT NULL,
    "isPoll" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Post" OWNER TO "user";

--
-- Name: Reaction; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Reaction" (
    id text NOT NULL,
    type text NOT NULL,
    "tenantId" text NOT NULL,
    "shadowUserId" text NOT NULL,
    "postId" text NOT NULL
);


ALTER TABLE public."Reaction" OWNER TO "user";

--
-- Name: Space; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Space" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "tenantId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Space" OWNER TO "user";

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: iam; Owner: user
--

COPY iam._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
89fddab8-6a06-4505-82d9-9af91efe2d0a	e69c9f21be2b53770b13ea52bf6c4f304a9fc86b41f1e932729ec2de45574341	2025-12-06 22:43:33.538672+00	0_init		\N	2025-12-06 22:43:33.538672+00	0
7f6055b9-4c85-4047-8139-444f2dae2132	6d18eeca6b5a08fa907d18a58807859287627fd7954403fa877216238fdd9033	\N	20251202022757_add_reaction_counters	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251202022757_add_reaction_counters\n\nDatabase error code: 42704\n\nDatabase error:\nERROR: index "Reaction_postId_shadowUserId_type_key" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42704), message: "index \\"Reaction_postId_shadowUserId_type_key\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(1304), routine: Some("DropErrorMsgNonExistent") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251202022757_add_reaction_counters"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251202022757_add_reaction_counters"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	\N	2025-12-06 22:44:14.783463+00	0
\.


--
-- Data for Name: AnonymousProfile; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."AnonymousProfile" (id, "tenantId", "shadowUserId", pseudonym, "avatarUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Comment" (id, content, "tenantId", "shadowUserId", "authorDisplayName", "postId", "createdAt") FROM stdin;
\.


--
-- Data for Name: PollOption; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."PollOption" (id, text, "voteCount", "postId") FROM stdin;
\.


--
-- Data for Name: PollVote; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."PollVote" (id, "tenantId", "shadowUserId", "pollOptionId") FROM stdin;
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Post" (id, "isGlobal", "tenantId", "shadowUserId", title, content, "isEdited", "isAnonymous", "authorDisplayName", "spaceId", "viewCount", "reactionCount", "commentCount", "isPoll", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Reaction; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Reaction" (id, type, "tenantId", "shadowUserId", "postId") FROM stdin;
\.


--
-- Data for Name: Space; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Space" (id, slug, name, description, "isPrivate", "tenantId", "createdAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: iam; Owner: user
--

ALTER TABLE ONLY iam._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AnonymousProfile AnonymousProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AnonymousProfile"
    ADD CONSTRAINT "AnonymousProfile_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: PollOption PollOption_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PollOption"
    ADD CONSTRAINT "PollOption_pkey" PRIMARY KEY (id);


--
-- Name: PollVote PollVote_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PollVote"
    ADD CONSTRAINT "PollVote_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: Reaction Reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_pkey" PRIMARY KEY (id);


--
-- Name: Space Space_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_pkey" PRIMARY KEY (id);


--
-- Name: AnonymousProfile_tenantId_pseudonym_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "AnonymousProfile_tenantId_pseudonym_key" ON public."AnonymousProfile" USING btree ("tenantId", pseudonym);


--
-- Name: AnonymousProfile_tenantId_shadowUserId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "AnonymousProfile_tenantId_shadowUserId_key" ON public."AnonymousProfile" USING btree ("tenantId", "shadowUserId");


--
-- Name: Comment_postId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Comment_postId_idx" ON public."Comment" USING btree ("postId");


--
-- Name: Comment_tenantId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Comment_tenantId_idx" ON public."Comment" USING btree ("tenantId");


--
-- Name: PollVote_pollOptionId_shadowUserId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "PollVote_pollOptionId_shadowUserId_key" ON public."PollVote" USING btree ("pollOptionId", "shadowUserId");


--
-- Name: Post_createdAt_id_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Post_createdAt_id_key" ON public."Post" USING btree ("createdAt", id);


--
-- Name: Post_isGlobal_createdAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Post_isGlobal_createdAt_idx" ON public."Post" USING btree ("isGlobal", "createdAt");


--
-- Name: Post_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Post_tenantId_createdAt_idx" ON public."Post" USING btree ("tenantId", "createdAt");


--
-- Name: Post_tenantId_shadowUserId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Post_tenantId_shadowUserId_idx" ON public."Post" USING btree ("tenantId", "shadowUserId");


--
-- Name: Reaction_postId_shadowUserId_type_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Reaction_postId_shadowUserId_type_key" ON public."Reaction" USING btree ("postId", "shadowUserId", type);


--
-- Name: Reaction_tenantId_idx; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "Reaction_tenantId_idx" ON public."Reaction" USING btree ("tenantId");


--
-- Name: Space_tenantId_slug_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Space_tenantId_slug_key" ON public."Space" USING btree ("tenantId", slug);


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PollOption PollOption_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PollOption"
    ADD CONSTRAINT "PollOption_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PollVote PollVote_pollOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."PollVote"
    ADD CONSTRAINT "PollVote_pollOptionId_fkey" FOREIGN KEY ("pollOptionId") REFERENCES public."PollOption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reaction Reaction_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jax61fdJkavI8umhppHaUergaYcBIfTUewAw8O1Nehp1uEtq8MnSt8FFUDfqV1i

