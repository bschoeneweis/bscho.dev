import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc";
import Image, { ImageProps } from "next/image";
import Link from "next/link";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export const CustomMDX = (props: MDXRemoteProps) => (
  <MDXRemote
    {...props}
    components={{
      img: (props) => (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image
          {...(props as ImageProps)}
          width={100}
          height={100}
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
        />
      ),
      a: (props) => {
        const { children, href } = props;
        const isInternalLink = Boolean(href?.startsWith('/'));
    
        return isInternalLink
          ? (
            <Link href={href as string}>{children}</Link>
          )
          : <a target="_blank" {...props} />;
      },
      table: (props) => (
        <div className="table-container">
          <table {...props} />
        </div>
      ),
    }}
    options={{
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
        ],
        rehypePlugins: [
          [rehypeSlug, {}],
          [rehypeAutolinkHeadings, {}],
          [rehypePrettyCode as any, { theme: 'github-dark' }],
        ]
      }
    }}
  />
);