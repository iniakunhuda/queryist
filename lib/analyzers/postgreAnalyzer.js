const { Pool } = require('pg');
const logger = require('../utils/logger');

class PostgreAnalyzer {
    constructor(config, i18n) {
        this.config = config;
        this.i18n = i18n;
    }

    async analyze(query) {
        let client;
        try {
            // Create connection pool
            const pool = new Pool({
                ...this.config,
                // Add query timeout
                statement_timeout: 10000,
                // Enable client-side query termination
                query_timeout: 10000
            });

            client = await pool.connect();

            // Validate query
            if (!query || typeof query !== 'string') {
                throw new Error('Invalid query provided');
            }

            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                throw new Error('Empty query provided');
            }

            if (!trimmedQuery.toLowerCase().startsWith('select')) {
                throw new Error('Only SELECT queries can be analyzed');
            }

            // Get execution plan with all available details
            let explainResult;
            try {
                const result = await client.query(`EXPLAIN (FORMAT JSON, ANALYZE, VERBOSE, BUFFERS, COSTS, TIMING) ${trimmedQuery}`);
                explainResult = result.rows[0]['QUERY PLAN'][0]; // PostgreSQL returns plan as JSON
            } catch (error) {
                throw new Error(`Failed to get execution plan: ${error.message}`);
            }

            // Get table statistics
            let tableStats = [];
            try {
                const statsResult = await client.query(`
                    SELECT 
                        schemaname,
                        relname as table_name,
                        n_live_tup as table_rows,
                        pg_total_relation_size(relid) as total_bytes,
                        pg_indexes_size(relid) as index_bytes
                    FROM pg_stat_user_tables
                    WHERE schemaname = $1
                `, [this.config.schema || 'public']);
                tableStats = statsResult.rows;
            } catch (error) {
                logger.warn('Failed to get table statistics:', error.message);
            }

            // Get existing indexes
            let indexes = [];
            try {
                const indexResult = await client.query(`
                    SELECT 
                        schemaname,
                        tablename as table_name,
                        indexname as index_name,
                        indexdef as index_definition
                    FROM pg_indexes
                    WHERE schemaname = $1
                `, [this.config.schema || 'public']);
                indexes = indexResult.rows;
            } catch (error) {
                logger.warn('Failed to get index information:', error.message);
            }

            // Generate recommendations
            const recommendations = this.generateRecommendations(explainResult, tableStats, indexes);

            return {
                query: trimmedQuery,
                executionPlan: explainResult,
                tableStatistics: tableStats,
                indexes: indexes,
                recommendations: recommendations
            };

        } catch (error) {
            throw new Error(`PostgreSQL Analysis Error: ${error.message}`);
        } finally {
            if (client) {
                try {
                    client.release();
                } catch (error) {
                    logger.warn('Error releasing client:', error.message);
                }
            }
        }
    }

    generateRecommendations(explainResult, tableStats, indexes) {
        const recommendations = [];

        try {
            if (!explainResult) return recommendations;

            // 1. Analyze scan methods
            this.analyzeScanMethods(explainResult.Plan, recommendations);

            // 2. Analyze join operations
            this.analyzeJoinOperations(explainResult.Plan, recommendations);

            // 3. Analyze temporary structures
            this.analyzeTemporaryStructures(explainResult.Plan, recommendations);

            // 4. Analyze index usage
            this.analyzeIndexUsage(explainResult.Plan, indexes, recommendations);

            // 5. Analyze table statistics
            this.analyzeTableStatistics(explainResult.Plan, tableStats, recommendations);

            // 6. Analyze parallel execution
            this.analyzeParallelExecution(explainResult.Plan, recommendations);

            // 7. Analyze partitioning
            this.analyzePartitioning(explainResult.Plan, recommendations);

            // 8. Analyze CTE usage
            this.analyzeCTEUsage(explainResult.Plan, recommendations);

            // 9. Analyze aggregation operations
            this.analyzeAggregationOperations(explainResult.Plan, recommendations);

            // 10. Analyze materialization
            this.analyzeMaterialization(explainResult.Plan, recommendations);

        } catch (error) {
            logger.warn(this.i18n.t('analyzer.errors.recommendations'), error.message);
        }

        return this.prioritizeRecommendations(recommendations);
    }

    analyzeScanMethods(plan, recommendations) {
        // Check for sequential scans
        if (plan.Node_Type === 'Seq Scan') {
            const tableName = plan['Relation Name'];
            recommendations.push({
                type: 'SEQUENTIAL_SCAN',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.sequentialScan.message', { tableName }),
                suggestion: this.i18n.t('analyzer.recommendations.sequentialScan.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.sequentialScan.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.sequentialScan.implementation.createIndex'),
                        this.i18n.t('analyzer.recommendations.sequentialScan.implementation.analyzeTable'),
                        this.i18n.t('analyzer.recommendations.sequentialScan.implementation.reviewWhere')
                    ]
                }
            });
        }

        // Check for inefficient index scans
        if (plan.Node_Type === 'Index Scan' && plan['Actual Rows'] > 1000 && plan['Index Cond'] === undefined) {
            recommendations.push({
                type: 'INEFFICIENT_INDEX_SCAN',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.inefficientIndexScan.message'),
                suggestion: this.i18n.t('analyzer.recommendations.inefficientIndexScan.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.inefficientIndexScan.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.inefficientIndexScan.implementation.reviewIndex'),
                        this.i18n.t('analyzer.recommendations.inefficientIndexScan.implementation.considerBitmap'),
                        this.i18n.t('analyzer.recommendations.inefficientIndexScan.implementation.checkStats')
                    ]
                }
            });
        }
    }

    analyzeJoinOperations(plan, recommendations) {
        // Check for nested loops with high row counts
        if (plan.Node_Type === 'Nested Loop' && plan['Actual Rows'] > 1000) {
            recommendations.push({
                type: 'EXPENSIVE_NESTED_LOOP',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.expensiveNestedLoop.message'),
                suggestion: this.i18n.t('analyzer.recommendations.expensiveNestedLoop.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.expensiveNestedLoop.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.expensiveNestedLoop.implementation.createIndex'),
                        this.i18n.t('analyzer.recommendations.expensiveNestedLoop.implementation.useHash'),
                        this.i18n.t('analyzer.recommendations.expensiveNestedLoop.implementation.rewriteJoin')
                    ]
                }
            });
        }

        // Check for hash joins with insufficient memory
        if (plan.Node_Type === 'Hash Join' && plan['Hash Batches'] > 1) {
            recommendations.push({
                type: 'HASH_SPILL',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.hashSpill.message'),
                suggestion: this.i18n.t('analyzer.recommendations.hashSpill.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.hashSpill.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.hashSpill.implementation.increaseMemory'),
                        this.i18n.t('analyzer.recommendations.hashSpill.implementation.optimizeJoin'),
                        this.i18n.t('analyzer.recommendations.hashSpill.implementation.partitionData')
                    ]
                }
            });
        }
    }

    analyzeTemporaryStructures(plan, recommendations) {
        // Check for temporary file usage
        if (plan['Temporary File Usage']) {
            recommendations.push({
                type: 'TEMP_FILES',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.tempFiles.message'),
                suggestion: this.i18n.t('analyzer.recommendations.tempFiles.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.tempFiles.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.tempFiles.implementation.increaseMemory'),
                        this.i18n.t('analyzer.recommendations.tempFiles.implementation.optimizeQuery'),
                        this.i18n.t('analyzer.recommendations.tempFiles.implementation.useIndexes')
                    ]
                }
            });
        }
    }

    analyzeIndexUsage(plan, indexes, recommendations) {
        // Check for missing indexes on join conditions
        if (plan.Node_Type === 'Hash Join' && !plan['Hash Cond'].includes('=')) {
            recommendations.push({
                type: 'MISSING_JOIN_INDEX',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.missingJoinIndex.message'),
                suggestion: this.i18n.t('analyzer.recommendations.missingJoinIndex.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.missingJoinIndex.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.missingJoinIndex.implementation.createIndex'),
                        this.i18n.t('analyzer.recommendations.missingJoinIndex.implementation.analyzeJoin'),
                        this.i18n.t('analyzer.recommendations.missingJoinIndex.implementation.considerFK')
                    ]
                }
            });
        }
    }

    analyzeTableStatistics(plan, tableStats, recommendations) {
        // Check for outdated statistics
        if (plan['Planning Time'] > 1000) {
            recommendations.push({
                type: 'OUTDATED_STATS',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.outdatedStats.message'),
                suggestion: this.i18n.t('analyzer.recommendations.outdatedStats.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.outdatedStats.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.outdatedStats.implementation.runAnalyze'),
                        this.i18n.t('analyzer.recommendations.outdatedStats.implementation.autoVacuum'),
                        this.i18n.t('analyzer.recommendations.outdatedStats.implementation.monitoring')
                    ]
                }
            });
        }
    }

    analyzeParallelExecution(plan, recommendations) {
        // Check for missed parallel opportunities
        if (!plan['Workers Planned'] && plan['Total Cost'] > 100000) {
            recommendations.push({
                type: 'MISSED_PARALLEL',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.missedParallel.message'),
                suggestion: this.i18n.t('analyzer.recommendations.missedParallel.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.missedParallel.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.missedParallel.implementation.enableParallel'),
                        this.i18n.t('analyzer.recommendations.missedParallel.implementation.adjustSettings'),
                        this.i18n.t('analyzer.recommendations.missedParallel.implementation.reviewQuery')
                    ]
                }
            });
        }
    }

    analyzePartitioning(plan, recommendations) {
        // Check for partition pruning effectiveness
        if (plan['Partitions Removed'] === 0 && plan.Node_Type.includes('Partition')) {
            recommendations.push({
                type: 'INEFFECTIVE_PARTITION',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.ineffectivePartition.message'),
                suggestion: this.i18n.t('analyzer.recommendations.ineffectivePartition.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.ineffectivePartition.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.ineffectivePartition.implementation.reviewStrategy'),
                        this.i18n.t('analyzer.recommendations.ineffectivePartition.implementation.addConstraints'),
                        this.i18n.t('analyzer.recommendations.ineffectivePartition.implementation.optimizeKeys')
                    ]
                }
            });
        }
    }

    analyzeCTEUsage(plan, recommendations) {
        // Check for materialized CTE optimization opportunities
        if (plan.Node_Type === 'CTE Scan' && plan['Actual Rows'] > 1 && !plan['CTE Materialized']) {
            recommendations.push({
                type: 'CTE_MATERIALIZATION',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.cteMaterialization.message'),
                suggestion: this.i18n.t('analyzer.recommendations.cteMaterialization.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.cteMaterialization.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.cteMaterialization.implementation.materialize'),
                        this.i18n.t('analyzer.recommendations.cteMaterialization.implementation.analyzeUsage'),
                        this.i18n.t('analyzer.recommendations.cteMaterialization.implementation.considerTemp')
                    ]
                }
            });
        }
    }

    analyzeAggregationOperations(plan, recommendations) {
        // Check for GroupAggregate vs HashAggregate
        if (plan.Node_Type === 'Group Aggregate' && plan['Actual Rows'] > 1000) {
            recommendations.push({
                type: 'INEFFICIENT_AGGREGATE',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.inefficientAggregate.message'),
                suggestion: this.i18n.t('analyzer.recommendations.inefficientAggregate.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.inefficientAggregate.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.inefficientAggregate.implementation.useHash'),
                        this.i18n.t('analyzer.recommendations.inefficientAggregate.implementation.addIndexes'),
                        this.i18n.t('analyzer.recommendations.inefficientAggregate.implementation.restructure')
                    ]
                }
            });
        }

        // Check for HashAggregate with spill
        if (plan.Node_Type === 'Hash Aggregate' && plan['Peak Memory Usage'] > plan['Peak Memory Allowed']) {
            recommendations.push({
                type: 'AGGREGATE_SPILL',
                severity: 'HIGH',
                message: this.i18n.t('analyzer.recommendations.aggregateSpill.message'),
                suggestion: this.i18n.t('analyzer.recommendations.aggregateSpill.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.aggregateSpill.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.aggregateSpill.implementation.increaseWork'),
                        this.i18n.t('analyzer.recommendations.aggregateSpill.implementation.limitGroups'),
                        this.i18n.t('analyzer.recommendations.aggregateSpill.implementation.useIndexes')
                    ]
                }
            });
        }
    }

    analyzeMaterialization(plan, recommendations) {
        // Check for materialization opportunities
        if (plan['Actual Loops'] > 1 && plan.Node_Type !== 'Materialize') {
            recommendations.push({
                type: 'MISSED_MATERIALIZATION',
                severity: 'MEDIUM',
                message: this.i18n.t('analyzer.recommendations.missedMaterialization.message'),
                suggestion: this.i18n.t('analyzer.recommendations.missedMaterialization.suggestion'),
                details: {
                    impact: this.i18n.t('analyzer.recommendations.missedMaterialization.impact'),
                    implementation: [
                        this.i18n.t('analyzer.recommendations.missedMaterialization.implementation.addMaterialize'),
                        this.i18n.t('analyzer.recommendations.missedMaterialization.implementation.analyzeMemory'),
                        this.i18n.t('analyzer.recommendations.missedMaterialization.implementation.considerCTE')
                    ]
                }
            });
        }
    }

    prioritizeRecommendations(recommendations) {
        // Define severity and type priorities
        const severityOrder = {
            HIGH: 0,
            MEDIUM: 1,
            LOW: 2
        };

        const priorityTypes = [
            'SEQUENTIAL_SCAN',
            'EXPENSIVE_NESTED_LOOP',
            'TEMP_FILES',
            'MISSING_JOIN_INDEX',
            'INEFFECTIVE_PARTITION',
            'AGGREGATE_SPILL'
        ];

        // Sort recommendations by severity and type
        return recommendations.sort((a, b) => {
            // First sort by severity
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity];
            }

            // Then sort by recommendation type priority
            const aTypePriority = priorityTypes.indexOf(a.type);
            const bTypePriority = priorityTypes.indexOf(b.type);

            if (aTypePriority !== bTypePriority) {
                return (aTypePriority === -1 ? Infinity : aTypePriority) -
                    (bTypePriority === -1 ? Infinity : bTypePriority);
            }

            // If same severity and priority, maintain stable sort
            return 0;
        });
    }

    // Helper method to recursively analyze nested plans
    analyzePlanNode(node, recommendations) {
        // Analyze current node
        this.analyzeScanMethods(node, recommendations);
        this.analyzeJoinOperations(node, recommendations);
        this.analyzeTemporaryStructures(node, recommendations);

        // Recursively analyze child nodes
        if (node.Plans) {
            node.Plans.forEach(childPlan => {
                this.analyzePlanNode(childPlan, recommendations);
            });
        }
    }
}

module.exports = PostgreAnalyzer;