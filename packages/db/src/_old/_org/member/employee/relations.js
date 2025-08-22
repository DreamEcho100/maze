// 📁 apps/volmify/src/server/libs/db/schema/org/member/employee/relations.js
import { relations } from "drizzle-orm";
import { accountTransaction, accountTransactionEmployeeContext } from "../../../account/schema.js";
import {
	orgCategory,
	orgCategoryAssociation,
	orgCategoryClosure,
	orgCategoryClosureAncestorPath,
} from "../../../general/category/schema.js";
import { userJobProfile } from "../../../user/profile/job/schema.js";
import { orgGiftCard } from "../../product/offers/schema.js";
import { orgProductRevenuePool } from "../../product/schema.js";
import { org } from "../../schema.js";
import { orgTaxRateSnapshot } from "../../tax/schema.js";
import { orgDepartmentEmployee } from "../department/schema.js";
import { orgMember } from "../schema.js";
import { orgTeamEmployee } from "../team/schema.js";
import { orgEmployeeInvitation } from "./invitation/schema.js";
import { orgEmployee } from "./schema.js";
