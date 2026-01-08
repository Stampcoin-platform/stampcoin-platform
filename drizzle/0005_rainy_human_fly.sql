CREATE TABLE `currencyDistribution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`archiveId` varchar(200),
	`nftId` int,
	`distributionType` enum('mint','purchase','trade','reward','burn','transfer') NOT NULL,
	`amount` int NOT NULL,
	`usdValue` decimal(12,2),
	`relatedTransactionId` int,
	`description` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `currencyDistribution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`expertiseAreas` text NOT NULL,
	`credentials` text NOT NULL,
	`experience` text,
	`references` text,
	`certifications` text,
	`motivation` text,
	`status` enum('pending','reviewing','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNotes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expertApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authenticationId` int NOT NULL,
	`expertId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`status` enum('assigned','accepted','declined','in_progress','completed') NOT NULL DEFAULT 'assigned',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`estimatedCompletionDays` int,
	`compensation` decimal(10,2),
	`notes` text,
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expertAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expertReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`authenticationId` int,
	`rating` int NOT NULL,
	`accuracy` int,
	`timeliness` int,
	`professionalism` int,
	`comment` text,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expertReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nftMintingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int NOT NULL,
	`userId` int NOT NULL,
	`blockchainNetwork` varchar(50) NOT NULL,
	`contractAddress` varchar(100) NOT NULL,
	`tokenId` varchar(100) NOT NULL,
	`transactionHash` varchar(200),
	`metadataUri` text,
	`imageUri` text,
	`mintingStatus` enum('preparing','pending','minting','minted','failed') NOT NULL DEFAULT 'preparing',
	`gasFee` decimal(18,8),
	`gasCurrency` varchar(10),
	`errorMessage` text,
	`mintedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nftMintingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerBenefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`benefitType` enum('discount','commission','feature','support','branding','exclusive_access') NOT NULL,
	`description` varchar(500) NOT NULL,
	`value` varchar(200),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerBenefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`transactionId` int,
	`type` enum('purchase','commission','reward','refund') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `partnerTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`companyNameAr` varchar(200),
	`description` text,
	`descriptionAr` text,
	`website` varchar(500),
	`logo` text,
	`logoKey` varchar(500),
	`tier` enum('bronze','silver','gold','platinum','diamond') NOT NULL,
	`totalInvestment` decimal(15,2) NOT NULL,
	`investmentDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('pending','approved','rejected','active','inactive') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvalDate` timestamp,
	`benefits` text,
	`contactPerson` varchar(200),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformCurrency` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currencyName` varchar(100) NOT NULL DEFAULT 'StampCoin',
	`currencySymbol` varchar(10) NOT NULL DEFAULT 'STMP',
	`totalSupply` int NOT NULL,
	`circulatingSupply` int NOT NULL,
	`maxSupply` int,
	`burnedSupply` int DEFAULT 0,
	`priceUSD` decimal(10,4) DEFAULT '0.1000',
	`marketCap` decimal(18,2),
	`volumeUSD` decimal(18,2),
	`pegged` boolean DEFAULT true,
	`pegValue` varchar(100) DEFAULT '0.1 USD',
	`contractAddress` varchar(100),
	`blockchainNetwork` varchar(50),
	`totalStampsInArchive` int DEFAULT 0,
	`totalNFTsMinted` int DEFAULT 0,
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platformCurrency_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stampAppraisals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int NOT NULL,
	`appraiserId` int,
	`appraiserName` varchar(200) NOT NULL,
	`appraiserCredentials` text,
	`appraisalType` enum('formal','informal','market_based','ai_estimated','auction_result') NOT NULL,
	`estimatedValue` decimal(12,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`valuationMethod` varchar(200),
	`marketConditions` text,
	`comparableSales` text,
	`factors` text,
	`report` text,
	`reportUrl` text,
	`validUntil` timestamp,
	`confidenceLevel` enum('low','medium','high','very_high'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stampAppraisals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stampArchive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`archiveId` varchar(200) NOT NULL,
	`country` varchar(100) NOT NULL,
	`denomination` decimal(10,2) NOT NULL,
	`year` int NOT NULL,
	`catalog` varchar(100) NOT NULL,
	`condition` enum('mint','used','fine','very_fine') NOT NULL,
	`rarity` enum('common','uncommon','rare','very_rare','legendary') NOT NULL,
	`description` text,
	`imageHash` varchar(200) NOT NULL,
	`imageUrl` text NOT NULL,
	`originalImageUrl` text,
	`usdValue` decimal(12,2) NOT NULL,
	`stampCoinValue` int NOT NULL,
	`serialNumber` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stampArchive_id` PRIMARY KEY(`id`),
	CONSTRAINT `stampArchive_archiveId_unique` UNIQUE(`archiveId`),
	CONSTRAINT `stampArchive_serialNumber_unique` UNIQUE(`serialNumber`)
);
--> statement-breakpoint
CREATE TABLE `stampAuthentications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int NOT NULL,
	`verifierId` int,
	`verifierName` varchar(200) NOT NULL,
	`verifierCredentials` text,
	`authenticationType` enum('expert_review','certificate_scan','ai_analysis','blockchain_provenance','third_party') NOT NULL,
	`status` enum('pending','in_progress','verified','rejected','disputed') NOT NULL DEFAULT 'pending',
	`confidenceScore` int,
	`findings` text,
	`supportingDocuments` text,
	`certificateIssued` boolean DEFAULT false,
	`certificateUrl` text,
	`verificationDate` timestamp,
	`expiryDate` timestamp,
	`cost` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stampAuthentications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stampNFT` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int,
	`archiveId` varchar(200),
	`serialNumber` varchar(100) NOT NULL,
	`nftTokenId` varchar(100) NOT NULL,
	`contractAddress` varchar(100) NOT NULL,
	`blockchainNetwork` varchar(50) NOT NULL,
	`ownerAddress` varchar(100),
	`ownerId` int,
	`metadataUri` text NOT NULL,
	`imageUri` text NOT NULL,
	`nftType` enum('collectible','certificate','deed','license') NOT NULL DEFAULT 'collectible',
	`mintedAt` timestamp NOT NULL DEFAULT (now()),
	`transactionHash` varchar(200),
	`gasUsed` decimal(18,8),
	`gasCurrency` varchar(10) DEFAULT 'ETH',
	`royaltyPercentage` decimal(5,2) DEFAULT '5.00',
	`royaltyRecipient` varchar(100),
	`totalTransactions` int DEFAULT 0,
	`lastSoldAt` timestamp,
	`lastSoldPrice` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stampNFT_id` PRIMARY KEY(`id`),
	CONSTRAINT `stampNFT_serialNumber_unique` UNIQUE(`serialNumber`),
	CONSTRAINT `stampNFT_nftTokenId_unique` UNIQUE(`nftTokenId`)
);
--> statement-breakpoint
CREATE TABLE `stampPricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int NOT NULL,
	`archiveId` varchar(200),
	`baseUsdPrice` decimal(12,2) NOT NULL,
	`stampCoinPrice` int NOT NULL,
	`conditionMultiplier` decimal(5,2) NOT NULL,
	`rarityMultiplier` decimal(5,2) NOT NULL,
	`finalPrice` decimal(12,2) NOT NULL,
	`priceSource` enum('manual','market_data','ai_estimated','appraisal','auction_result') NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validUntil` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stampPricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stampProvenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stampId` int NOT NULL,
	`previousOwnerId` int,
	`newOwnerId` int,
	`transactionId` int,
	`transferType` enum('sale','gift','inheritance','auction','trade','initial_mint') NOT NULL,
	`transferDate` timestamp NOT NULL DEFAULT (now()),
	`verificationDocument` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stampProvenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','expert','appraiser') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `categories` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `categories` ADD `continent` varchar(50);--> statement-breakpoint
ALTER TABLE `categories` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `categories` ADD `icon` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `nftTokenId` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `nftContractAddress` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `blockchainNetwork` varchar(50);--> statement-breakpoint
ALTER TABLE `stamps` ADD `mintedAt` timestamp;--> statement-breakpoint
ALTER TABLE `stamps` ADD `nftMetadataUri` text;--> statement-breakpoint
ALTER TABLE `stamps` ADD `authenticationStatus` enum('pending','verified','rejected','expired');--> statement-breakpoint
ALTER TABLE `stamps` ADD `authenticationType` enum('expert_review','certificate_scan','ai_analysis','blockchain_provenance','third_party');--> statement-breakpoint
ALTER TABLE `stamps` ADD `physicalStampId` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `certificateNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `appraisalValue` decimal(12,2);--> statement-breakpoint
ALTER TABLE `stamps` ADD `appraisalDate` timestamp;--> statement-breakpoint
ALTER TABLE `stamps` ADD `appraisedBy` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `continent` varchar(50);--> statement-breakpoint
ALTER TABLE `stamps` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `issuedBy` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `denomination` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `color` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `perforation` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `watermark` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `printingMethod` varchar(100);--> statement-breakpoint
ALTER TABLE `stamps` ADD `designer` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `engraver` varchar(200);--> statement-breakpoint
ALTER TABLE `stamps` ADD `quantity` int;--> statement-breakpoint
ALTER TABLE `stamps` ADD `condition` varchar(50);--> statement-breakpoint
ALTER TABLE `stamps` ADD `historicalSignificance` text;--> statement-breakpoint
ALTER TABLE `stamps` ADD `marketTrend` enum('rising','stable','declining','volatile');--> statement-breakpoint
ALTER TABLE `stamps` ADD `estimatedValue` decimal(12,2);--> statement-breakpoint
ALTER TABLE `stamps` ADD `lastSoldPrice` decimal(12,2);--> statement-breakpoint
ALTER TABLE `stamps` ADD `lastSoldDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `expertiseAreas` text;--> statement-breakpoint
ALTER TABLE `users` ADD `credentials` text;--> statement-breakpoint
ALTER TABLE `users` ADD `verifiedExpert` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `expertRating` decimal(3,2);--> statement-breakpoint
ALTER TABLE `users` ADD `totalAuthentications` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `totalAppraisals` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `currencyDistribution` ADD CONSTRAINT `currencyDistribution_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `currencyDistribution` ADD CONSTRAINT `currencyDistribution_archiveId_stampArchive_archiveId_fk` FOREIGN KEY (`archiveId`) REFERENCES `stampArchive`(`archiveId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `currencyDistribution` ADD CONSTRAINT `currencyDistribution_nftId_stampNFT_id_fk` FOREIGN KEY (`nftId`) REFERENCES `stampNFT`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertApplications` ADD CONSTRAINT `expertApplications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertApplications` ADD CONSTRAINT `expertApplications_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertAssignments` ADD CONSTRAINT `expertAssignments_authenticationId_stampAuthentications_id_fk` FOREIGN KEY (`authenticationId`) REFERENCES `stampAuthentications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertAssignments` ADD CONSTRAINT `expertAssignments_expertId_users_id_fk` FOREIGN KEY (`expertId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertAssignments` ADD CONSTRAINT `expertAssignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertReviews` ADD CONSTRAINT `expertReviews_expertId_users_id_fk` FOREIGN KEY (`expertId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertReviews` ADD CONSTRAINT `expertReviews_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expertReviews` ADD CONSTRAINT `expertReviews_authenticationId_stampAuthentications_id_fk` FOREIGN KEY (`authenticationId`) REFERENCES `stampAuthentications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nftMintingHistory` ADD CONSTRAINT `nftMintingHistory_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nftMintingHistory` ADD CONSTRAINT `nftMintingHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerBenefits` ADD CONSTRAINT `partnerBenefits_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerTransactions` ADD CONSTRAINT `partnerTransactions_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerTransactions` ADD CONSTRAINT `partnerTransactions_transactionId_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partners` ADD CONSTRAINT `partners_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampAppraisals` ADD CONSTRAINT `stampAppraisals_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampAppraisals` ADD CONSTRAINT `stampAppraisals_appraiserId_users_id_fk` FOREIGN KEY (`appraiserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampAuthentications` ADD CONSTRAINT `stampAuthentications_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampAuthentications` ADD CONSTRAINT `stampAuthentications_verifierId_users_id_fk` FOREIGN KEY (`verifierId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampNFT` ADD CONSTRAINT `stampNFT_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampNFT` ADD CONSTRAINT `stampNFT_archiveId_stampArchive_archiveId_fk` FOREIGN KEY (`archiveId`) REFERENCES `stampArchive`(`archiveId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampNFT` ADD CONSTRAINT `stampNFT_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampPricing` ADD CONSTRAINT `stampPricing_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampPricing` ADD CONSTRAINT `stampPricing_archiveId_stampArchive_archiveId_fk` FOREIGN KEY (`archiveId`) REFERENCES `stampArchive`(`archiveId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampProvenance` ADD CONSTRAINT `stampProvenance_stampId_stamps_id_fk` FOREIGN KEY (`stampId`) REFERENCES `stamps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampProvenance` ADD CONSTRAINT `stampProvenance_previousOwnerId_users_id_fk` FOREIGN KEY (`previousOwnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampProvenance` ADD CONSTRAINT `stampProvenance_newOwnerId_users_id_fk` FOREIGN KEY (`newOwnerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stampProvenance` ADD CONSTRAINT `stampProvenance_transactionId_transactions_id_fk` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;