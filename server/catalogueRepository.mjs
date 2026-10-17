const allowedCategories = new Set(['role-based', 'people-process', 'people-behavioural', 'tools-technology', 'certifications', 'technical-training']);
const allowedLevels = new Set(['Awareness', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']);
const sortExpressions = {
  Recommended: 'c.published_at DESC NULLS LAST, c.course_id ASC',
  'A–Z': 'c.title ASC, c.course_id ASC',
  Popular: 'c.published_at DESC NULLS LAST, c.course_id ASC',
  Trending: 'c.published_at DESC NULLS LAST, c.course_id ASC',
};

function durationLabel(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  }
  return `${minutes} Minutes`;
}

function baseProgramme(row) {
  const publicCategory = row.category_code === 'tools-technology'
    ? 'ai-tools'
    : row.category_code === 'technical-training'
      ? 'tools-technology'
      : row.category_code === 'people-process'
        ? row.sub_type === 'Process'
          ? 'process-based'
          : 'people-behavioural'
      : row.category_code === 'people-behavioural'
        ? 'people-behavioural'
      : row.category_code;
  const programme = {
    id: row.course_id,
    title: row.title,
    category: publicCategory,
    level: row.level_code,
    duration: durationLabel(row.duration_minutes),
    format: row.format || undefined,
    seoIndexable: row.seo_indexable === true,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    details: {
      summary: row.summary || undefined,
      delivery: row.delivery || undefined,
      approach: row.approach || undefined,
      format: row.format || undefined,
      toolsCovered: row.tools_covered || [],
    },
  };

  if (row.category_code === 'tools-technology') {
    return {
      ...programme,
      categoryBadge: 'Tool or Technology',
      imageUrl: row.image_url || '',
      toolLogoUrl: row.tool_logo_url || '',
      toolName: row.tool_name,
      vendor: row.vendor,
      skillArea: row.skill_area || undefined,
      technologyCategory: row.technology_categories || [],
    };
  }

  if (row.category_code === 'technical-training') {
    return {
      ...programme,
      categoryBadge: 'Tool or Technology',
      imageUrl: row.image_url || '',
      toolLogoUrl: '',
      toolName: row.primary_technology,
      vendor: row.technical_vendor || 'Various',
      skillArea: row.technical_domain,
      technologyCategory: row.technology_categories || [],
      sourceCourseId: row.source_course_id,
      sourceDuration: row.source_duration,
    };
  }

  if (row.category_code === 'role-based') {
    return {
      ...programme,
      categoryBadge: 'Role-Based Programme',
      imageUrl: row.image_url || '',
      relatedSkills: row.related_skills || [],
      industry: row.industry || undefined,
      department: row.department || undefined,
      functionName: row.function_name || undefined,
      roleTitle: row.role_title || undefined,
    };
  }

  if (row.category_code === 'certifications') {
    return {
      ...programme,
      categoryBadge: 'Certification Programme',
      imageUrl: row.image_url || '',
      provider: row.certification_provider,
      providerCourseCode: row.course_code_public === false ? undefined : row.certification_code,
      examCode: row.certification_exam_code || undefined,
      courseUrl: row.certification_url || undefined,
      productTechnologies: row.product_technologies || [],
      roles: row.certification_roles || [],
      recordKind: row.certification_record_kind || 'training-course',
      credentialType: row.credential_type || undefined,
      credentialClassification: row.credential_classification || undefined,
      credentialStatus: row.credential_status || undefined,
      credentialLevel: row.credential_level || undefined,
      examDuration: row.exam_duration_text || undefined,
      validityRenewal: row.validity_renewal || undefined,
    };
  }

  return {
    ...programme,
    category: publicCategory,
    badge: publicCategory === 'process-based' ? 'Process Based' : 'People & Behavioural',
    topicCategory: row.topic_category || (publicCategory === 'process-based' ? 'Process Based' : 'People & Behavioural'),
    imageUrl: row.image_url || '',
    subType: row.sub_type || undefined,
    portfolio: row.portfolio || undefined,
  };
}

function buildFilters(filters) {
  const conditions = ["c.status = 'published'"];
  const values = [];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.category) {
    if (!allowedCategories.has(filters.category)) throw new Error('Invalid category filter.');
    conditions.push(`c.category_code = ${addValue(filters.category)}`);
  }
  if (filters.level) {
    if (!allowedLevels.has(filters.level)) throw new Error('Invalid level filter.');
    conditions.push(`c.level_code = ${addValue(filters.level)}`);
  }
  if (filters.tools?.length) {
    conditions.push(`COALESCE(tt.tool_name, tech.primary_technology) = ANY(${addValue(filters.tools)}::text[])`);
  }
  if (filters.industries?.length) conditions.push(`rb.industry = ANY(${addValue(filters.industries)}::text[])`);
  if (filters.departments?.length) conditions.push(`rb.department = ANY(${addValue(filters.departments)}::text[])`);
  if (filters.subTypes?.length) conditions.push(`pp.sub_type = ANY(${addValue(filters.subTypes)}::text[])`);
  if (filters.portfolios?.length) {
    conditions.push(`(pp.portfolio = ANY(${addValue(filters.portfolios)}::text[]) OR pp.topic_category = ANY(${addValue(filters.portfolios)}::text[]))`);
  }
  if (filters.providers?.length) conditions.push(`cert.provider = ANY(${addValue(filters.providers)}::text[])`);
  if (filters.productTechnologies?.length) {
    conditions.push(`cert.product_technologies && ${addValue(filters.productTechnologies)}::text[]`);
  }
  if (filters.technologyCategories?.length) {
    conditions.push(`EXISTS (
      SELECT 1 FROM catalogue.course_technology_categories filter_ctc
      WHERE filter_ctc.course_id = c.course_id
        AND filter_ctc.category_name = ANY(${addValue(filters.technologyCategories)}::text[])
    )`);
  }
  if (filters.durationMinutes?.length) {
    conditions.push(`c.duration_minutes = ANY(${addValue(filters.durationMinutes)}::integer[])`);
  }
  if (filters.query) {
    const queryParameter = addValue(filters.query);
    conditions.push(`(
      c.search_document @@ websearch_to_tsquery('simple', ${queryParameter})
      OR c.title ILIKE '%' || ${queryParameter} || '%'
      OR c.course_id ILIKE '%' || ${queryParameter} || '%'
      OR tt.tool_name ILIKE '%' || ${queryParameter} || '%'
      OR tt.vendor ILIKE '%' || ${queryParameter} || '%'
      OR tech.primary_technology ILIKE '%' || ${queryParameter} || '%'
      OR tech.vendor ILIKE '%' || ${queryParameter} || '%'
      OR tech.domain ILIKE '%' || ${queryParameter} || '%'
      OR rb.industry ILIKE '%' || ${queryParameter} || '%'
      OR rb.department ILIKE '%' || ${queryParameter} || '%'
      OR rb.function_name ILIKE '%' || ${queryParameter} || '%'
      OR rb.role_title ILIKE '%' || ${queryParameter} || '%'
      OR cert.provider ILIKE '%' || ${queryParameter} || '%'
      OR cert.course_code ILIKE '%' || ${queryParameter} || '%'
      OR cert.exam_code ILIKE '%' || ${queryParameter} || '%'
      OR cert.credential_type ILIKE '%' || ${queryParameter} || '%'
      OR cert.credential_classification ILIKE '%' || ${queryParameter} || '%'
      OR cert.credential_level ILIKE '%' || ${queryParameter} || '%'
      OR EXISTS (
        SELECT 1 FROM catalogue.certification_exams search_exams
        WHERE search_exams.course_id = c.course_id
          AND (
            search_exams.exam_code ILIKE '%' || ${queryParameter} || '%'
            OR search_exams.exam_name ILIKE '%' || ${queryParameter} || '%'
          )
      )
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(cert.product_technologies, ARRAY[]::text[])) product(value)
        WHERE product.value ILIKE '%' || ${queryParameter} || '%'
      )
      OR EXISTS (
        SELECT 1 FROM catalogue.course_related_skills search_skills
        WHERE search_skills.course_id = c.course_id
          AND search_skills.skill ILIKE '%' || ${queryParameter} || '%'
      )
      OR EXISTS (
        SELECT 1 FROM catalogue.course_tools search_tools
        WHERE search_tools.course_id = c.course_id
          AND search_tools.tool_name ILIKE '%' || ${queryParameter} || '%'
      )
    )`);
  }

  return { whereSql: conditions.join('\nAND '), values };
}

const catalogueSelect = `
  SELECT
    ccv.*,
    c.seo_indexable,
    c.seo_title,
    c.seo_description
  FROM catalogue.course_catalogue_view ccv
  JOIN catalogue.courses c ON c.course_id = ccv.course_id
  LEFT JOIN catalogue.tools_technology_details tt ON tt.course_id = c.course_id
  LEFT JOIN catalogue.technical_training_details tech ON tech.course_id = c.course_id
  LEFT JOIN catalogue.role_based_details rb ON rb.course_id = c.course_id
  LEFT JOIN catalogue.people_process_details pp ON pp.course_id = c.course_id
  LEFT JOIN catalogue.certification_details cert ON cert.course_id = c.course_id
`;

export async function listCourses(pool, filters) {
  const effectiveFilters = allowedLevels.has(filters.sort) && !filters.level
    ? { ...filters, level: filters.sort }
    : filters;
  const { whereSql, values } = buildFilters(effectiveFilters);
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(9, Math.max(1, filters.pageSize || 9));
  const offset = (page - 1) * pageSize;
  const sortSql = sortExpressions[filters.sort] || (allowedLevels.has(filters.sort)
    ? 'c.title ASC, c.course_id ASC'
    : sortExpressions.Recommended);

  const countSql = `
    SELECT count(*)::integer AS total
    FROM catalogue.courses c
    LEFT JOIN catalogue.tools_technology_details tt ON tt.course_id = c.course_id
    LEFT JOIN catalogue.technical_training_details tech ON tech.course_id = c.course_id
    LEFT JOIN catalogue.role_based_details rb ON rb.course_id = c.course_id
    LEFT JOIN catalogue.people_process_details pp ON pp.course_id = c.course_id
    LEFT JOIN catalogue.certification_details cert ON cert.course_id = c.course_id
    WHERE ${whereSql}
  `;
  const dataSql = `${catalogueSelect}
    WHERE ${whereSql}
    ORDER BY ${sortSql}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countSql, values),
    pool.query(dataSql, [...values, pageSize, offset]),
  ]);
  const total = countResult.rows[0]?.total || 0;

  return {
    data: dataResult.rows.map(baseProgramme),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

export async function getCourseById(pool, courseId) {
  const baseResult = await pool.query(
    `${catalogueSelect}
     WHERE c.status = 'published'
       AND c.course_id = COALESCE(
         (SELECT mapping.new_course_id
          FROM catalogue.certification_id_mappings mapping
          WHERE mapping.old_course_id = $1),
         $1
       )`,
    [courseId],
  );
  if (baseResult.rowCount === 0) return null;
  const resolvedCourseId = baseResult.rows[0].course_id;

  const [objectives, audiences, prerequisites, modules, scenarios] = await Promise.all([
    pool.query('SELECT objective FROM catalogue.course_objectives WHERE course_id = $1 ORDER BY display_order', [resolvedCourseId]),
    pool.query('SELECT audience FROM catalogue.course_audiences WHERE course_id = $1 ORDER BY display_order', [resolvedCourseId]),
    pool.query('SELECT prerequisite FROM catalogue.course_prerequisites WHERE course_id = $1 ORDER BY display_order', [resolvedCourseId]),
    pool.query(
      `SELECT m.id, m.module_code, m.title, m.description, m.learning_path_title,
              m.learning_path_description, m.duration_minutes, m.applied_exercise_title,
              m.applied_exercise_content, o.outcome_type, o.outcome, o.display_order AS outcome_order
       FROM catalogue.course_modules m
       LEFT JOIN catalogue.module_learning_outcomes o ON o.module_id = m.id
       WHERE m.course_id = $1
       ORDER BY m.display_order, o.outcome_type, o.display_order`,
      [resolvedCourseId],
    ),
    pool.query('SELECT title, workflow, content FROM catalogue.course_scenarios WHERE course_id = $1 ORDER BY display_order', [resolvedCourseId]),
  ]);

  const moduleMap = new Map();
  for (const row of modules.rows) {
    if (!moduleMap.has(row.id)) {
      moduleMap.set(row.id, {
        id: row.module_code,
        title: row.title,
        description: row.description || undefined,
        learningPathTitle: row.learning_path_title || undefined,
        learningPathDescription: row.learning_path_description || undefined,
        concepts: [],
        practicalActivities: [],
        learningOutcomes: [],
        ...(row.duration_minutes ? { duration: durationLabel(row.duration_minutes) } : {}),
        ...(row.applied_exercise_title ? {
          appliedExercise: {
            title: row.applied_exercise_title,
            content: row.applied_exercise_content,
          },
        } : {}),
      });
    }
    if (row.outcome) {
      const module = moduleMap.get(row.id);
      if (row.outcome_type === 'learning_objective') module.learningOutcomes.push(row.outcome);
      if (row.outcome_type === 'concept' || row.outcome_type === 'topic') module.concepts.push(row.outcome);
      if (row.outcome_type === 'practical_activity' || row.outcome_type === 'lab') module.practicalActivities.push(row.outcome);
    }
  }

  const programme = baseProgramme(baseResult.rows[0]);
  const objectiveList = objectives.rows.map((row) => row.objective);
  programme.details = {
    ...programme.details,
    objective: baseResult.rows[0].objective || objectiveList.join('\n'),
    objectives: objectiveList,
    audience: audiences.rows.map((row) => row.audience),
    prerequisitesList: prerequisites.rows.map((row) => row.prerequisite),
    modules: [...moduleMap.values()],
    scenarios: scenarios.rows.map((row) => ({
      title: row.title,
      workflow: row.workflow || undefined,
      description: row.content,
      content: [row.workflow, row.content].filter(Boolean).join('\n\n'),
    })),
  };

  if (baseResult.rows[0].category_code === 'certifications') {
    const [certificationExams, certificationObjectives, certificationRequirements,
      certificationResources, certificationLifecycle] = await Promise.all([
      pool.query(
        `SELECT exam_code, exam_name, exam_status, requirement_type, duration_minutes,
                duration_text, delivery_format, delivery_provider, proctored, languages,
                price, currency, passing_score, exam_url, notes
         FROM catalogue.certification_exams
         WHERE course_id = $1
         ORDER BY display_order`,
        [resolvedCourseId],
      ),
      pool.query(
        `SELECT group_title, objective, weight, objective_level, objective_code
         FROM catalogue.certification_objectives
         WHERE course_id = $1
         ORDER BY display_order`,
        [resolvedCourseId],
      ),
      pool.query(
        `SELECT requirement_type, requirement_group, requirement, requirement_url,
                qualifier, notes
         FROM catalogue.certification_requirements
         WHERE course_id = $1
         ORDER BY display_order`,
        [resolvedCourseId],
      ),
      pool.query(
        `SELECT resource_type, title, resource_url, duration_text, item_count,
                relationship, notes
         FROM catalogue.certification_training_resources
         WHERE course_id = $1
         ORDER BY display_order`,
        [resolvedCourseId],
      ),
      pool.query(
        `SELECT record_type, status, validity_renewal, retirement_transition, details,
                scenario, option_text, action_text, outcome
         FROM catalogue.certification_lifecycle_items
         WHERE course_id = $1
         ORDER BY display_order`,
        [resolvedCourseId],
      ),
    ]);
    programme.details = {
      ...programme.details,
      provider: baseResult.rows[0].certification_provider,
      providerCourseCode: baseResult.rows[0].course_code_public === false
        ? undefined
        : baseResult.rows[0].certification_code,
      examCode: baseResult.rows[0].certification_exam_code || undefined,
      courseUrl: baseResult.rows[0].certification_url || undefined,
      productTechnologies: baseResult.rows[0].product_technologies || [],
      roles: baseResult.rows[0].certification_roles || [],
      subjects: baseResult.rows[0].certification_subjects || [],
      languageCodes: baseResult.rows[0].language_codes || [],
      certificationInformation: baseResult.rows[0].certification_information || undefined,
      recordKind: baseResult.rows[0].certification_record_kind || 'training-course',
      credentialType: baseResult.rows[0].credential_type || undefined,
      credentialClassification: baseResult.rows[0].credential_classification || undefined,
      credentialStatus: baseResult.rows[0].credential_status || undefined,
      credentialLevel: baseResult.rows[0].credential_level || undefined,
      categoryTrack: baseResult.rows[0].certification_category_track || undefined,
      examFormatDelivery: baseResult.rows[0].exam_format_delivery || undefined,
      examDuration: baseResult.rows[0].exam_duration_text || undefined,
      timeLimit: baseResult.rows[0].time_limit_text || undefined,
      price: baseResult.rows[0].price_text || undefined,
      retakeFee: baseResult.rows[0].retake_fee_text || undefined,
      validityRenewal: baseResult.rows[0].validity_renewal || undefined,
      requiredExamPathway: baseResult.rows[0].required_exam_pathway || undefined,
      exams: certificationExams.rows.map((row) => ({
        examCode: row.exam_code || undefined,
        examName: row.exam_name || undefined,
        status: row.exam_status || undefined,
        requirementType: row.requirement_type || undefined,
        duration: row.duration_text || durationLabel(row.duration_minutes),
        deliveryFormat: row.delivery_format || undefined,
        deliveryProvider: row.delivery_provider || undefined,
        proctored: row.proctored || undefined,
        languages: row.languages || [],
        price: row.price || undefined,
        currency: row.currency || undefined,
        passingScore: row.passing_score || undefined,
        url: row.exam_url || undefined,
        notes: row.notes || undefined,
      })),
      certificationObjectives: certificationObjectives.rows.map((row) => ({
        groupTitle: row.group_title || undefined,
        objective: row.objective,
        weight: row.weight || undefined,
        level: row.objective_level || undefined,
        code: row.objective_code || undefined,
      })),
      certificationRequirements: certificationRequirements.rows.map((row) => ({
        type: row.requirement_type || undefined,
        group: row.requirement_group || undefined,
        requirement: row.requirement,
        url: row.requirement_url || undefined,
        qualifier: row.qualifier || undefined,
        notes: row.notes || undefined,
      })),
      trainingResources: certificationResources.rows.map((row) => ({
        type: row.resource_type || undefined,
        title: row.title,
        url: row.resource_url || undefined,
        duration: row.duration_text || undefined,
        itemCount: row.item_count || undefined,
        relationship: row.relationship || undefined,
        notes: row.notes || undefined,
      })),
      lifecycle: certificationLifecycle.rows.map((row) => ({
        recordType: row.record_type || undefined,
        status: row.status || undefined,
        validityRenewal: row.validity_renewal || undefined,
        retirementTransition: row.retirement_transition || undefined,
        details: row.details || undefined,
        scenario: row.scenario || undefined,
        option: row.option_text || undefined,
        action: row.action_text || undefined,
        outcome: row.outcome || undefined,
      })),
    };
  }

  return programme;
}

export async function getCatalogueFilters(pool, category, { subType } = {}) {
  if (!allowedCategories.has(category)) throw new Error('Invalid category filter.');
  if (category === 'people-process' || category === 'people-behavioural') {
    const result = await pool.query(`
      SELECT 'portfolio' AS group_id, COALESCE(pp.portfolio, pp.topic_category) AS value, count(*)::integer AS count
      FROM catalogue.courses c
      JOIN catalogue.people_process_details pp ON pp.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = $1
        AND ($2::text IS NULL OR pp.sub_type = $2)
      GROUP BY COALESCE(pp.portfolio, pp.topic_category)
      UNION ALL
      SELECT 'duration' AS group_id, c.duration_minutes::text AS value, count(*)::integer AS count
      FROM catalogue.courses c
      JOIN catalogue.people_process_details pp ON pp.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = $1
        AND ($2::text IS NULL OR pp.sub_type = $2)
      GROUP BY c.duration_minutes
    `, [category, subType || null]);
    const definitions = [
      { id: 'portfolio', title: 'Category', initialVisibleCount: 9 },
      { id: 'duration', title: 'Duration' },
    ];
    return {
      groups: definitions.map((definition) => ({
        ...definition,
        allowMultiple: true,
        options: result.rows
          .filter((row) => row.group_id === definition.id)
          .map((row) => ({
            id: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            label: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            count: row.count,
          })),
      })),
    };
  }

  if (category === 'certifications') {
    const result = await pool.query(`
      SELECT 'provider' AS group_id, cert.provider AS value, count(*)::integer AS count
      FROM catalogue.courses c
      JOIN catalogue.certification_details cert ON cert.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = 'certifications'
      GROUP BY cert.provider
      UNION ALL
      SELECT 'productTechnology', technology.value, count(*)::integer
      FROM catalogue.courses c
      JOIN catalogue.certification_details cert ON cert.course_id = c.course_id
      CROSS JOIN LATERAL unnest(cert.product_technologies) technology(value)
      WHERE c.status = 'published' AND c.category_code = 'certifications'
      GROUP BY technology.value
      UNION ALL
      SELECT 'duration', c.duration_minutes::text, count(*)::integer
      FROM catalogue.courses c
      WHERE c.status = 'published' AND c.category_code = 'certifications'
        AND c.duration_minutes IS NOT NULL
      GROUP BY c.duration_minutes
    `);
    const definitions = [
      { id: 'provider', title: 'Provider' },
      { id: 'productTechnology', title: 'Product / Technology', initialVisibleCount: 8 },
      { id: 'duration', title: 'Duration' },
    ];
    return {
      groups: definitions.map((definition) => ({
        ...definition,
        allowMultiple: true,
        options: result.rows
          .filter((row) => row.group_id === definition.id)
          .map((row) => ({
            id: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            label: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            count: row.count,
          }))
          .sort((left, right) => definition.id === 'duration'
            ? Number.parseInt(left.id, 10) - Number.parseInt(right.id, 10)
            : left.label.localeCompare(right.label)),
      })),
    };
  }

  if (category === 'technical-training') {
    const result = await pool.query(`
      SELECT 'technology' AS group_id, tech.primary_technology AS value, count(*)::integer AS count
      FROM catalogue.courses c
      JOIN catalogue.technical_training_details tech ON tech.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = 'technical-training'
      GROUP BY tech.primary_technology
      UNION ALL
      SELECT 'toolCategory', tech.domain, count(*)::integer
      FROM catalogue.courses c
      JOIN catalogue.technical_training_details tech ON tech.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = 'technical-training'
      GROUP BY tech.domain
      UNION ALL
      SELECT 'duration', c.duration_minutes::text, count(*)::integer
      FROM catalogue.courses c
      WHERE c.status = 'published' AND c.category_code = 'technical-training'
      GROUP BY c.duration_minutes
    `);
    const definitions = [
      { id: 'technology', title: 'Technology', initialVisibleCount: 8 },
      { id: 'toolCategory', title: 'Domain' },
      { id: 'duration', title: 'Duration' },
    ];
    return {
      groups: definitions.map((definition) => ({
        ...definition,
        allowMultiple: true,
        options: result.rows
          .filter((row) => row.group_id === definition.id)
          .map((row) => ({
            id: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            label: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            count: row.count,
          }))
          .sort((left, right) => definition.id === 'duration'
            ? Number.parseInt(left.id, 10) - Number.parseInt(right.id, 10)
            : left.label.localeCompare(right.label)),
      })),
    };
  }

  if (category === 'role-based') {
    const result = await pool.query(`
      SELECT 'industry' AS group_id, rb.industry AS value, count(*)::integer AS count
      FROM catalogue.courses c
      JOIN catalogue.role_based_details rb ON rb.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = 'role-based' AND rb.industry IS NOT NULL
      GROUP BY rb.industry
      UNION ALL
      SELECT 'department', rb.department, count(*)::integer
      FROM catalogue.courses c
      JOIN catalogue.role_based_details rb ON rb.course_id = c.course_id
      WHERE c.status = 'published' AND c.category_code = 'role-based' AND rb.department IS NOT NULL
      GROUP BY rb.department
      UNION ALL
      SELECT 'duration', c.duration_minutes::text, count(*)::integer
      FROM catalogue.courses c
      WHERE c.status = 'published' AND c.category_code = 'role-based'
      GROUP BY c.duration_minutes
    `);

    const definitions = [
      { id: 'industry', title: 'Industry' },
      { id: 'department', title: 'Department', initialVisibleCount: 8 },
      { id: 'duration', title: 'Duration' },
    ];
    return {
      groups: definitions.map((definition) => ({
        ...definition,
        allowMultiple: true,
        options: result.rows
          .filter((row) => row.group_id === definition.id)
          .map((row) => ({
            id: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            label: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
            count: row.count,
          }))
          .sort((left, right) => definition.id === 'duration'
            ? Number.parseInt(left.id, 10) - Number.parseInt(right.id, 10)
            : left.label.localeCompare(right.label)),
      })),
    };
  }

  const result = await pool.query(`
    SELECT 'technology' AS group_id, tt.tool_name AS value, count(*)::integer AS count
    FROM catalogue.courses c
    JOIN catalogue.tools_technology_details tt ON tt.course_id = c.course_id
    WHERE c.status = 'published' AND c.category_code = 'tools-technology'
    GROUP BY tt.tool_name
    UNION ALL
    SELECT 'toolCategory', category.category_name, count(*)::integer
    FROM catalogue.courses c
    JOIN catalogue.course_technology_categories category ON category.course_id = c.course_id
    WHERE c.status = 'published' AND c.category_code = 'tools-technology'
    GROUP BY category.category_name
    UNION ALL
    SELECT 'duration', c.duration_minutes::text, count(*)::integer
    FROM catalogue.courses c
    WHERE c.status = 'published' AND c.category_code = 'tools-technology'
    GROUP BY c.duration_minutes
  `);

  const definitions = [
    { id: 'technology', title: 'Technology', initialVisibleCount: 8 },
    { id: 'toolCategory', title: 'Tool Category' },
    { id: 'duration', title: 'Duration' },
  ];

  return {
    groups: definitions.map((definition) => ({
      ...definition,
      allowMultiple: true,
      options: result.rows
        .filter((row) => row.group_id === definition.id)
        .map((row) => ({
          id: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
          label: definition.id === 'duration' ? durationLabel(Number(row.value)) : row.value,
          count: row.count,
        }))
        .sort((left, right) => {
          if (definition.id === 'duration') {
            return Number.parseInt(left.id, 10) - Number.parseInt(right.id, 10);
          }
          return left.label.localeCompare(right.label);
        }),
    })),
  };
}
