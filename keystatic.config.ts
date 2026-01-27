import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    // 1. Projects (Updated Schema)
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'description' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'AI / Data Science', value: 'AI Research' },
            { label: 'Embedded System', value: 'Embedded System' },
            { label: 'Web Development', value: 'Web Development' },
            { label: 'Mobile App', value: 'Mobile App' },
            { label: 'Other', value: 'Other' },
          ],
          defaultValue: 'Other',
        }),
        role: fields.text({ label: 'Role' }),
        team_size: fields.integer({ label: 'Team Size' }),
        start_date: fields.date({ label: 'Start Date' }),
        end_date: fields.date({ label: 'End Date' }),
        tech_stack: fields.array(
          fields.relationship({
            label: 'Tech Stack',
            collection: 'techStack',
          }),
          {
            label: 'Tech Stack',
            itemLabel: (props) => props.value || 'Select Tech',
          }
        ),
        description: fields.mdx({
          label: 'Description (MDX)',
          options: {
            imageDirectory: 'src/assets/images/projects',
            publicPath: '/assets/images/projects/',
          },
        }),
        github_url: fields.url({ label: 'GitHub URL' }),
        demo_url: fields.url({ label: 'Demo URL' }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        visible: fields.checkbox({ label: 'Visible', defaultValue: true }),
      },
    }),

    // 2. Tech Stacks (New - for reference)
    techStack: collection({
      label: 'Tech Stacks',
      slugField: 'name',
      path: 'src/content/tech-stack/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Frontend', value: 'Frontend' },
            { label: 'Backend', value: 'Backend' },
            { label: 'Embedded', value: 'Embedded' },
            { label: 'AI / ML', value: 'AI/ML' },
            { label: 'DevOps', value: 'DevOps' },
            { label: 'Tools', value: 'Tools' },
          ],
          defaultValue: 'Frontend',
        }),
        icon_url: fields.text({ label: 'Icon URL (Optional)' }),
      },
    }),

    // 3. Concept Notes (New - for AI Graph RAG)
    conceptNotes: collection({
      label: 'Concept Notes (Graph)',
      slugField: 'topic',
      path: 'src/content/concept-notes/*',
      format: { contentField: 'content' },
      schema: {
        topic: fields.slug({ name: { label: 'Topic' } }),
        related_concepts: fields.array(
          fields.relationship({
            label: 'Related Concept',
            collection: 'conceptNotes',
          }),
          {
            label: 'Related Concepts (Graph Edges)',
            description: 'AI will populate this field automatically in the future.',
            itemLabel: (props) => props.value || 'Select Concept',
          }
        ),
        ai_explanation: fields.text({
          label: 'AI Explanation (Definition)',
          multiline: true,
          description: 'Auto-generated definition by Gemini.',
        }),
        content: fields.mdx({
          label: 'My Notes',
          options: {
            imageDirectory: 'src/assets/images/concepts',
            publicPath: '/assets/images/concepts/',
          },
        }),
        visual_graph: fields.json({
          label: 'Graph Data (JSON)',
          description: 'Internal use for visualization',
        }),
      },
    }),

    // 4. Blog (New)
    blog: collection({
      label: 'Blog',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        published_date: fields.date({ label: 'Published Date' }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        content: fields.mdx({
          label: 'Content',
          options: {
            imageDirectory: 'src/assets/images/blog',
            publicPath: '/assets/images/blog/',
          },
        }),
      },
    }),

    // 5. Resume Sections
    work: collection({
      label: 'Work Experience',
      slugField: 'company',
      path: 'src/content/work/*',
      format: { data: 'json' },
      schema: {
        company: fields.slug({ name: { label: 'Company' } }),
        position: fields.text({ label: 'Position' }),
        department: fields.text({ label: 'Department' }),
        start_date: fields.date({ label: 'Start Date' }),
        end_date: fields.date({ label: 'End Date' }),
        is_current: fields.checkbox({ label: 'Current Job?' }),
        description: fields.text({ label: 'Description', multiline: true }),
        achievements: fields.array(fields.text({ label: 'Achievement' }), {
          label: 'Achievements',
          itemLabel: (props) => props.value,
        }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        visible: fields.checkbox({ label: 'Visible', defaultValue: true }),
      },
    }),
    education: collection({
      label: 'Education',
      slugField: 'school',
      path: 'src/content/education/*',
      format: { data: 'json' },
      schema: {
        school: fields.slug({ name: { label: 'School' } }),
        major: fields.text({ label: 'Major' }),
        degree: fields.text({ label: 'Degree' }),
        status: fields.text({ label: 'Status' }),
        start_date: fields.date({ label: 'Start Date' }),
        end_date: fields.date({ label: 'End Date' }),
        gpa: fields.text({ label: 'GPA' }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        visible: fields.checkbox({ label: 'Visible', defaultValue: true }),
      },
    }),
    certifications: collection({
      label: 'Certifications',
      slugField: 'name',
      path: 'src/content/certifications/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Certification Name' } }),
        issuer: fields.text({ label: 'Issuer' }),
        date: fields.date({ label: 'Date' }),
        type: fields.text({ label: 'Type' }),
        score: fields.text({ label: 'Score' }),
        order: fields.integer({ label: 'Order', defaultValue: 0 }),
        visible: fields.checkbox({ label: 'Visible', defaultValue: true }),
      },
    }),
  },
  singletons: {
    profile: singleton({
      label: 'Profile',
      path: 'src/content/profile/jylee',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Name' }),
        title: fields.text({ label: 'Title' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        area: fields.array(fields.text({ label: 'Area' }), {
          label: 'Areas',
          itemLabel: (props) => props.value,
        }),
        email: fields.text({ label: 'Email' }),
        phone: fields.text({ label: 'Phone' }),
        photo: fields.text({ label: 'Photo URL' }),
      },
    }),
  },
});
