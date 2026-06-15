// SPDX-FileCopyrightText: 2026 AG Technology Group LLC
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from "@tanstack/react-router"
import { HomePage } from "@/pages/home/home-page"

export const Route = createFileRoute("/")({
  component: HomePage,
})
