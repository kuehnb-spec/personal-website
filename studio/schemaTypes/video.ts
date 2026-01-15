import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoType',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube / Vimeo URL', value: 'external'},
          {title: 'Upload File', value: 'upload'},
        ],
        layout: 'radio',
      },
      initialValue: 'external',
    }),
    defineField({
      name: 'videoUrl',
      title: 'YouTube / Vimeo URL',
      type: 'url',
      description: 'Paste the full YouTube or Vimeo URL here',
      hidden: ({document}) => document?.videoType !== 'external',
    }),
    defineField({
      name: 'video',
      title: 'Video File',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      description: 'Upload a video file (counts against 500MB Sanity limit)',
      hidden: ({document}) => document?.videoType !== 'upload',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Optional thumbnail image for the video',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'dateTaken',
      title: 'Date Taken',
      type: 'date',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      caption: 'caption',
    },
    prepare({title, media, caption}) {
      return {
        title: title,
        subtitle: caption,
        media: media,
      }
    },
  },
})
