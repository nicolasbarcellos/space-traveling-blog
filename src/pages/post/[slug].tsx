import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { data } = post;
  console.log(data.content);
  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>

      {/* <img src="/banner.png" alt="Post Banner" /> */}
      <main className={styles.postWrapper}>
        <img src="/banner.png" alt={data.title} />

        <h1>{data.title}</h1>
        <div className="postInfo">
          <span>
            <FiCalendar color="#bbbbbb" size="20" />{' '}
            {post.first_publication_date}
          </span>
          <span>
            <FiUser color="#bbbbbb" size="20" /> {data.author}
          </span>
          <div className="postContent">
            {data.content.map(content => {
              return (
                <>
                  <h2>{content.heading}</h2>
                  //! mostrar body
                  <p>{content.body}</p>
                </>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
  // const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  // TODO
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('blog_post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'd MMM Y',
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 3600,
  };
};
